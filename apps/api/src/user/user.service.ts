import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { Loggable } from '@lib/logger/decorator/loggable';
import { JwtTokenType } from '../auth/types/jwtToken.type';
import { InfoteamIdpService } from '@lib/infoteam-idp';

@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly infoteamIdpService: InfoteamIdpService,
  ) {}

  // deprecated
  async refresh(refreshToken: string): Promise<JwtTokenType> {
    const tokens = await this.infoteamIdpService.refresh(refreshToken);
    const userData = await this.infoteamIdpService.getUserInfo(
      tokens.access_token,
    );
    const user = await this.userRepository.findUserOrCreate({
      uuid: userData.uuid,
      name: userData.name,
      email: userData.email,
    });
    return {
      ...tokens,
      consent_required: !user?.consent,
    };
  }

  // deprecated
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

  async findUserOrCreate(
    user: Pick<User, 'uuid' | 'name' | 'email'>,
  ): Promise<User> {
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

  async deleteUser(user: User): Promise<void> {
    return this.userRepository.deleteUserByUuid(user.uuid);
  }

  async deleteFcmTokens(fcmTokens: string[]) {
    return this.userRepository.deleteFcmTokens(fcmTokens);
  }
}
