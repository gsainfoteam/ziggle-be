import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdpJwtResponse, IdpUserInfoResponse } from './types/idp.type';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { UserInfo } from './types/userInfo.type';

@Injectable()
export class InfoteamIdpService {
  private readonly logger = new Logger(InfoteamIdpService.name, {
    timestamp: true,
  });
  private readonly idpUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.idpUrl = this.configService.getOrThrow<string>('IDP_URL');
  }

  /**
   * this method is used to get the access token from the infoteam idp
   * @param code it is the code that is returned from the idp
   * @param redirectUri this is the redirect uri that is used to get the code
   * @returns accessToken and refreshToken
   * @throws UnauthorizedException if the code is invalid
   * @throws InternalServerErrorException if there is an unknown error while getting the access token
   */
  async getAccessToken(
    code: string,
    redirectUri: string,
  ): Promise<IdpJwtResponse> {
    this.logger.log('getAccessToken called');
    const accessTokenResponse = await firstValueFrom(
      this.httpService
        .post<IdpJwtResponse>(
          this.idpUrl + '/token',
          {
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: this.configService.getOrThrow<string>('CLIENT_ID'),
              password: this.configService.getOrThrow<string>('CLIENT_SECRET'),
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            if (error instanceof AxiosError && error.response?.status === 401) {
              this.logger.debug('Invalid code');
              throw new UnauthorizedException();
            }
            this.logger.error(error.message);
            throw new InternalServerErrorException();
          }),
        ),
    );
    this.logger.log('getAccessToken response');
    return accessTokenResponse.data;
  }

  /**
   * this method is used to get the user info from the idp
   * @param accessToken it is the access token that is returned from the idp
   * @returns userInfo
   * @throws UnauthorizedException if the access token is invalid
   * @throws InternalServerErrorException if there is an unknown error while getting the user info
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    this.logger.log('getUserInfo called');
    const userInfoResponse = await firstValueFrom(
      this.httpService
        .get<IdpUserInfoResponse>(this.idpUrl + '/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            if (error instanceof AxiosError && error.response?.status === 401) {
              this.logger.debug('Invalid access token');
              throw new UnauthorizedException();
            }
            this.logger.error(error.message);
            throw new InternalServerErrorException();
          }),
        ),
    );
    this.logger.log('getUserInfo response');
    const {
      uuid,
      name,
      email,
      phone_number: phoneNumber,
      student_id: studentNumber,
    } = userInfoResponse.data;
    return { uuid, name, email, phoneNumber, studentNumber };
  }

  /**
   * this method is used to refresh the access token
   * @param refreshToken it is the refresh token that is returned from the idp
   * @returns accessToken and refreshToken
   * @throws UnauthorizedException if the refresh token is invalid
   * @throws InternalServerErrorException if there is an unknown error while refreshing the token
   */
  async refresh(refreshToken: string): Promise<IdpJwtResponse> {
    this.logger.log('refresh called');
    const accessTokenResponse = await firstValueFrom(
      this.httpService
        .post<IdpJwtResponse>(
          this.idpUrl + '/token',
          {
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: this.configService.getOrThrow<string>('CLIENT_ID'),
              password: this.configService.getOrThrow<string>('CLIENT_SECRET'),
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            if (error instanceof AxiosError && error.response?.status === 401) {
              this.logger.debug('Invalid refresh token');
              throw new UnauthorizedException();
            }
            this.logger.error(error.message);
            throw new InternalServerErrorException();
          }),
        ),
    );
    this.logger.log('refresh response');
    return accessTokenResponse.data;
  }

  /**
   * this method is used to revoke the token
   * @param token it is the token that is returned from the idp
   * @throws UnauthorizedException if the token is invalid
   * @throws InternalServerErrorException if there is an unknown error while revoking the token
   */
  async revoke(token: string): Promise<void> {
    this.logger.log('revoke called');
    await firstValueFrom(
      this.httpService
        .post(
          this.idpUrl + '/revoke',
          {
            token,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: this.configService.getOrThrow<string>('CLIENT_ID'),
              password: this.configService.getOrThrow<string>('CLIENT_SECRET'),
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            if (error instanceof AxiosError && error.response?.status === 401) {
              this.logger.debug('Invalid token');
              throw new UnauthorizedException();
            }
            this.logger.error(error.message);
            throw new InternalServerErrorException();
          }),
        ),
    );
    this.logger.log('revoke response');
  }
}
