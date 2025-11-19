import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { Loggable } from '@lib/logger/decorator/loggable';

@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * this method is used to set the user consent about ziggle service
   * @param user
   * @returns void
   */
  async setConsent(user: User): Promise<void> {
    await this.userRepository.setConsent(user);
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
