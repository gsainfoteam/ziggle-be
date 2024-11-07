import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto/req/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './user.repository';
import { JwtTokenType } from './types/jwtToken.type';
import { User } from '@prisma/client';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { Loggable } from '@lib/logger/decorator/loggable';
@Injectable()
@Loggable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly infoteamIdpService: InfoteamIdpService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * this method is used to infoteam idp login,
   * so we can assume user must have idp account
   * because the sign up is handled by idp
   *
   * @returns accessToken, refreshToken and the information that is  the user consent required
   */
  async login({ code, type }: LoginDto): Promise<JwtTokenType> {
    if (!code || !type) {
      this.logger.debug('invalid code or type');
      throw new BadRequestException();
    }
    const redirectUri =
      type === 'flutter'
        ? this.configService.getOrThrow<string>('FLUTTER_REDIRECT_URI')
        : type === 'local'
          ? this.configService.getOrThrow<string>('LOCAL_REDIRECT_URI')
          : this.configService.getOrThrow<string>('WEB_REDIRECT_URI');
    const tokens = await this.infoteamIdpService.getAccessToken(
      code,
      redirectUri,
    );
    const userInfo = await this.infoteamIdpService.getUserInfo(
      tokens.access_token,
    );
    const user = await this.userRepository.findUserOrCreate({
      uuid: userInfo.uuid,
      name: userInfo.name,
    });
    return {
      ...tokens,
      consent_required: !user?.consent,
    };
  }

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
}
