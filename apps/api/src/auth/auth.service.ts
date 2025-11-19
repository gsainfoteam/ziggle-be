import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { IssueTokenType, JwtTokenType } from './types/jwtToken.type';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { RedisService } from 'libs/redis/src';
import ms, { StringValue } from 'ms';
import { User } from '@prisma/client';

@Injectable()
@Loggable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenPrefix = 'ziggleRefreshToken';
  private readonly refreshTokenExpire: number;
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    this.refreshTokenExpire = ms(
      customConfigService.REFRESH_TOKEN_EXPIRE as StringValue,
    );
  }

  async login(auth: string): Promise<JwtTokenType> {
    const idpToken = auth.split(' ')[1];
    const { uuid, name, email } =
      await this.infoteamIdpService.getUserInfo(idpToken);
    const user = await this.authRepository
      .findUserOrCreate({ uuid, name, email })
      .catch(() => {
        throw new UnauthorizedException();
      });
    const tokens = await this.issueTokens(uuid);
    return { ...tokens, consent_required: user.consent };
  }

  /**
   * this method is used to refresh the access token.
   * therefore, the user must have a refresh token.
   * @param refreshToken
   * @returns accessToken, refreshToken and the information that is  the user consent required
   */
  async refresh(refreshToken: string): Promise<JwtTokenType> {
    const uuid = await this.redisService.getOrThrow<string>(refreshToken, {
      prefix: this.refreshTokenPrefix,
    });
    const user = await this.authRepository.findUserByUuid(uuid);
    return {
      access_token: this.jwtService.sign({}, { subject: uuid }),
      refresh_token: refreshToken,
      consent_required: user.consent,
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

  private async issueTokens(uuid: string): Promise<IssueTokenType> {
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
