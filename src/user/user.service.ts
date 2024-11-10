import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto/req/login.dto';
import { IdpService } from 'src/idp/idp.service';
import { UserRepository } from './user.repository';
import { JwtTokenType } from './types/jwtToken.type';
import { User } from '@prisma/client';
import { setFcmTokenReq } from './dto/req/setFcmTokenReq.dto';
import { CustomConfigService } from 'src/config/customConfig.service';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly idpService: IdpService,
    private readonly customConfigService: CustomConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * this method is used to infoteam idp login,
   * so we can assume user must have idp account
   * becuase the sign up is handled by idp
   *
   * @returns accessToken, refreshToken and the information that is  the user consent required
   */
  async login({ code, type }: LoginDto): Promise<JwtTokenType> {
    this.logger.log('login called');
    if (!code || !type) {
      this.logger.debug('invalid code or type');
      throw new BadRequestException();
    }
    const redirectUri =
      type === 'flutter'
        ? this.customConfigService.FLUTTER_REDIRECT_URI
        : type === 'local'
          ? this.customConfigService.LOCAL_REDIRECT_URI
          : this.customConfigService.WEB_REDIRECT_URI;
    const tokens = await this.idpService.getAccessTokenFromIdP(
      code,
      redirectUri,
    );
    const userInfo = await this.idpService.getUserInfo(tokens.access_token);
    const user = await this.userRepository.findUserOrCreate({
      uuid: userInfo.uuid,
      name: userInfo.name,
    });
    this.logger.log('login finished');
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
    this.logger.log('refresh called');
    const tokens = await this.idpService.refreshToken(refreshToken);
    const userData = await this.idpService.getUserInfo(tokens.access_token);
    const user = await this.userRepository.findUserOrCreate({
      uuid: userData.uuid,
      name: userData.name,
    });
    this.logger.log('refresh finished');
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
    this.logger.log('logout called');
    await this.idpService.revokeToken(accessToken);
    await this.idpService.revokeToken(refreshToken);
  }

  /**
   * this method is used to set the user consent about ziggle service
   * @param user
   * @returns void
   */
  async setConsent(user: User): Promise<void> {
    this.logger.log('setConsent called');
    await this.userRepository.setConsent(user);
  }

  /**
   * this method is used to find the user or create the user
   * @param user
   * @returns user
   */
  async findUserOrCreate(user: Pick<User, 'uuid' | 'name'>): Promise<User> {
    this.logger.log('findUserOrCreate called');
    return this.userRepository.findUserOrCreate(user);
  }

  async findOrCreateTempUser(user: Pick<User, 'name'>): Promise<User> {
    this.logger.log('findOrCreateTempUser called');
    const findedUser = await this.userRepository.findUserByName(user);
    if (findedUser) {
      return findedUser;
    }
    return this.userRepository.createTempUser(user);
  }

  async setFcmToken(userUuid: string, fcmToken: setFcmTokenReq) {
    this.logger.log('setFcmToken is called');
    return this.userRepository.setFcmToken(userUuid, fcmToken);
  }
}
