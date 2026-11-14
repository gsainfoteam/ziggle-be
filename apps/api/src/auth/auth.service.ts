import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountError } from '@infoteam/account-nest';
import { AuthRepository } from './auth.repository';
import { JwtTokenType } from './types/jwtToken.type';
import { AccountService } from './account';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { LoginReq } from './dto/req/sessionReq.dto';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { RedisService } from 'libs/redis/src';
import ms, { StringValue } from 'ms';
import { User } from '@generated/prisma/client';
import { Trace } from '../otel/trace.decorator';

@Injectable()
@Loggable()
@Trace()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenPrefix = 'ziggleRefreshToken';
  private readonly refreshTokenExpire: number;
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly accountService: AccountService,
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    this.refreshTokenExpire = ms(
      customConfigService.REFRESH_TOKEN_EXPIRE as StringValue,
    );
  }

  async login(body: LoginReq): Promise<JwtTokenType> {
    const { user: idpUser } = await this.accountService
      .loginWithCode({
        code: body.code,
        codeVerifier: body.code_verifier,
        redirectUri: body.redirect_uri,
        nonce: body.nonce,
        iss: body.iss,
      })
      .catch(toHttpError);
    const user = await this.authRepository.findUserOrCreate({
      uuid: idpUser.sub,
      name: idpUser.name,
      email: idpUser.email,
      picture: idpUser.picture ?? null,
    });
    const tokens = await this.issueTokens(user.uuid);
    return tokens;
  }

  /** shortcut: app versions released before the account SDK still send an IdP access token; remove once they are gone. */
  async loginWithIdpToken(authorization: string): Promise<JwtTokenType> {
    const idpToken = authorization.split(' ')[1];
    const userinfo = await this.infoteamIdpService.getUserInfo(idpToken);
    const user = await this.authRepository
      .findUserOrCreate(userinfo)
      .catch(() => {
        throw new UnauthorizedException();
      });
    return this.issueTokens(user.uuid);
  }

  /**
   * this method is used to refresh the access token.
   * therefore, the user must have a refresh token.
   * @param refreshToken
   * @returns accessToken, refreshToken and the information that is  the user consent required
   */
  async refresh(refreshToken: string): Promise<JwtTokenType> {
    const uuid = await this.redisService.get<string>(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });
    if (!uuid) {
      throw new UnauthorizedException();
    }
    await this.authRepository.findUserByUuid(uuid);
    return {
      access_token: this.jwtService.sign({}, { subject: uuid }),
      refresh_token: refreshToken,
    };
  }

  /**
   * this method is used to logout the user from the idp
   * @param accessToken
   * @param refreshToken
   * @returns void
   */
  async logout(refreshToken: string): Promise<void> {
    await this.redisService.del(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });
  }

  async findUserByUuid(uuid: string): Promise<User> {
    return await this.authRepository.findUserByUuid(uuid);
  }

  private generateOpaqueToken() {
    return crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+//=]/g, '');
  }

  private async issueTokens(uuid: string): Promise<JwtTokenType> {
    const refresh_token: string = this.generateOpaqueToken();
    await this.redisService.set<string>(refresh_token, uuid, {
      prefix: this.refreshTokenPrefix,
      ttl: this.refreshTokenExpire / 1000,
    });
    return {
      access_token: this.jwtService.sign({}, { subject: uuid }),
      refresh_token,
    };
  }
}

function toHttpError(error: unknown): never {
  if (!AccountError.is(error)) throw error;

  const body = { error: error.code, error_description: error.description };
  switch (error.code) {
    case 'invalid_request':
      throw new BadRequestException(body);
    case 'network_error':
    case 'server_error':
    case 'discovery_failed':
    case 'temporarily_unavailable':
      throw new BadGatewayException(body);
    case 'invalid_client':
    case 'unauthorized_client':
    case 'invalid_scope':
    case 'missing_claims':
      throw new InternalServerErrorException(body);
    default:
      throw new UnauthorizedException(body);
  }
}
