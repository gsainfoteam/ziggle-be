import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './user.repository';
import { JwtToken } from './type/jwt.type';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { idpJwtResponse, idpUserInfoResponse } from './type/idp.type';
import { AxiosError } from 'axios';
import { UserInfo } from './type/userInfo.type';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/global/entity/user.entity';

@Injectable()
export class UserService {
  private idp_url: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.idp_url = this.configService.get<string>('IDP_URL');
  }

  /** get access token from idp server */
  async getAccessTokenFromIdP(
    authCode: string,
    isFlutter: boolean,
  ): Promise<idpJwtResponse> {
    const url = this.idp_url + '/token';
    const accessTokeResponse = await firstValueFrom(
      this.httpService
        .post<idpJwtResponse>(
          url,
          {
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: isFlutter
              ? this.configService.get<string>('FLUTTER_REDIRECT_URI')
              : this.configService.get<string>('WEB_REDIRECT_URI'),
          },
          {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            auth: {
              username: this.configService.get<string>('CLIENT_ID'),
              password: this.configService.get<string>('CLIENT_SECRET_KEY'),
            },
          },
        )
        .pipe(
          catchError((err: AxiosError) => {
            if (err.response?.status === 400) {
              throw new UnauthorizedException('Invalid auth code');
            }
            throw new InternalServerErrorException('network error');
          }),
        ),
    );

    return accessTokeResponse.data;
  }

  async refreshTokenFromIdP(refreshToken: string): Promise<idpJwtResponse> {
    const url = this.idp_url + '/token';
    const refreshResponse = await firstValueFrom(
      this.httpService
        .post<idpJwtResponse>(
          url,
          {
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          },
          {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            auth: {
              username: this.configService.get<string>('CLIENT_ID'),
              password: this.configService.get<string>('CLIENT_SECRET_KEY'),
            },
          },
        )
        .pipe(
          catchError((err: AxiosError) => {
            if (err.response?.status === 400) {
              throw new UnauthorizedException('Invalid refresh token');
            }
            throw new InternalServerErrorException('network error');
          }),
        ),
    );
    return refreshResponse.data;
  }

  /** get user information from idp server with access token */
  async getUserInfoFromIdP(token: string): Promise<UserInfo> {
    const url = this.idp_url + '/userinfo';
    const params = { access_token: token };

    const userInfoResponse = await firstValueFrom(
      this.httpService.get<idpUserInfoResponse>(url, { params }).pipe(
        catchError((err: AxiosError) => {
          if (err.response?.status === 401) {
            throw new UnauthorizedException('Invalid access');
          }
          throw new InternalServerErrorException('network error');
        }),
      ),
    );

    return userInfoResponse.data;
  }

  private async revokeTokenFromIdp(token: string) {
    const url = this.idp_url + '/revoke';
    await firstValueFrom(
      this.httpService.post(
        url,
        { token },
        {
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          auth: {
            username: this.configService.get<string>('CLIENT_ID'),
            password: this.configService.get<string>('CLIENT_SECRET_KEY'),
          },
        },
      ),
    );
  }

  /** we assume user must have idp account */
  async login({ code }: LoginDto, isFlutter: boolean): Promise<JwtToken> {
    const tokens = await this.getAccessTokenFromIdP(code, isFlutter);
    const userData = await this.getUserInfoFromIdP(tokens.access_token);

    // if user not exist (user not use ziggle, but user has idp account), create user (auto sign up)
    const user = await this.userRepository.findByUserUUID(userData.user_uuid);
    if (!user) {
      await this.userRepository.createUser(userData);
    }

    return { ...tokens, consent_required: !user?.consent };
  }

  async refresh(refreshToken: string): Promise<JwtToken> {
    const tokens = await this.refreshTokenFromIdP(refreshToken);
    const userData = await this.getUserInfoFromIdP(tokens.access_token);

    const user = await this.userRepository.findByUserUUID(userData.user_uuid);
    if (!user) {
      await this.userRepository.createUser(userData);
    }

    return { ...tokens, consent_required: !user?.consent };
  }

  async logout(accessToken: string, refreshToken: string) {
    await this.revokeTokenFromIdp(accessToken);
    await this.revokeTokenFromIdp(refreshToken);
    return { message: 'success' };
  }

  async setFcmToken(userUuid: string, fcmToken: string) {
    await this.userRepository.setFcmToken(userUuid, fcmToken);
    return { message: 'success', fcm_token: fcmToken };
  }

  async setConsent(user: User) {
    await this.userRepository.setConsent(user);
  }
}
