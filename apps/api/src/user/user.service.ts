import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { IssueTokenType, JwtTokenType } from './types/jwtToken.type';
import { User } from '@prisma/client';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { RedisService } from 'libs/redis/src';
import ms, { StringValue } from 'ms';

@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly refreshTokenPrefix = 'ziggleRefreshToken';
  private readonly refreshTokenExpire: number;
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly userRepository: UserRepository,
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
    const user = await this.userRepository
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
    const user = await this.userRepository.findUserByUuid(uuid);
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

  /**
   * this method is used to set the user consent about ziggle service
   * @param user
   * @returns void
   */
  async setConsent(user: User): Promise<void> {
    await this.userRepository.setConsent(user);
  }

  /**
   * this method is used to find the user or create the user
   * @param user
   * @returns user
   */
  async findUserOrCreate(
    user: Pick<User, 'uuid' | 'name' | 'email'>,
  ): Promise<User> {
    return this.userRepository.findUserOrCreate(user);
  }

  async findUserByUuid(uuid: string): Promise<User> {
    return await this.userRepository.findUserByUuid(uuid);
  }

  async findOrCreateTempUser(user: Pick<User, 'name'>): Promise<User> {
    const foundUser = await this.userRepository.findUserByName(user);
    if (foundUser) {
      return foundUser;
    }
    return this.userRepository.createTempUser(user);
  }

  async setFcmToken(userUuid: string, fcmToken: setFcmTokenReq) {
    return this.userRepository.setFcmToken(userUuid, fcmToken);
  }

  async deleteUser(user: User): Promise<void> {
    return this.userRepository.deleteUserByUuid(user.uuid);
  }

  async deleteFcmTokens(fcmTokens: string[]) {
    return this.userRepository.deleteFcmTokens(fcmTokens);
  }

  private generateOpaqueToken() {
    return crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+//=]/g, '');
  }

  private async issueTokens(uuid: string): Promise<IssueTokenType> {
    const refresh_token: string = this.generateOpaqueToken();
    this.redisService.set<string>(refresh_token, uuid, {
      prefix: this.refreshTokenPrefix,
      ttl: this.refreshTokenExpire,
    });
    return {
      access_token: this.jwtService.sign({}, { subject: uuid }),
      refresh_token,
    };
  }
}
