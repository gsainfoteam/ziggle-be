import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { JwtTokenType } from './types/jwtToken.type';
import { User } from '@prisma/client';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * this method is used to refresh the access token.
   * therefore, the user must have a refresh token.
   * @param refreshToken
   * @returns accessToken, refreshToken and the information that is  the user consent required
   */
  async refresh(refreshToken: string): Promise<JwtTokenType> {
    const tokens = await this.infoteamIdpService.refresh(refreshToken);
    const userData = await this.infoteamIdpService.getUserInfo(
      tokens.access_token,
    );
    const user = await this.userRepository.findUserOrCreate({
      uuid: userData.uuid,
      name: userData.name,
    });
    return {
      ...tokens,
      consent_required: !user?.consent,
    };
  }

  /**
   * this method is used to logout the user from the idp
   * @param accessToken
   * @param refreshToken
   * @returns void
   */
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    await this.infoteamIdpService.revoke(accessToken);
    await this.infoteamIdpService.revoke(refreshToken);
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
  async findUserOrCreate(user: Pick<User, 'uuid' | 'name'>): Promise<User> {
    return this.userRepository.findUserOrCreate(user);
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

  async deleteFcmTokens(fcmTokens: string[]) {
    return this.userRepository.deleteFcmTokens(fcmTokens);
  }
}
