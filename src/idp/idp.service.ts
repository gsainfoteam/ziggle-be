import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { IdpJwtResponse, IdpUserInfoRes } from './types/idp.type';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { UserInfo } from './types/userInfo.type';
import { CustomConfigService } from 'src/config/customConfig.service';

@Injectable()
export class IdpService {
  private readonly logger = new Logger(IdpService.name);
  private idpUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.idpUrl = this.customConfigService.IDP_URL;
  }

  /**
   * this method is used to get the access token from the idp
   * @param code this is the code that is returned from the idp
   * @param redirectUri this is the redirect uri that is used to get the code
   * @returns accessToken, refreshToken
   */
  async getAccessTokenFromIdP(
    code: string,
    redirectUri: string,
  ): Promise<IdpJwtResponse> {
    this.logger.log('getAccessTokenFromIdP called');
    const url = this.idpUrl + '/token';
    const accessTokenResponse = await firstValueFrom(
      this.httpService
        .post<IdpJwtResponse>(
          url,
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
              username: this.customConfigService.CLIENT_ID,
              password: this.customConfigService.CLIENT_SECRET,
            },
          },
        )
        .pipe(
          catchError((err: AxiosError) => {
            if (err instanceof AxiosError && err.response?.status === 401) {
              this.logger.debug('user invalid code');
              throw new UnauthorizedException();
            }
            this.logger.error(err);
            this.logger.error(err.response?.data);
            throw new InternalServerErrorException();
          }),
        ),
    );
    this.logger.log('getAccessTokenFromIdP success');
    return accessTokenResponse.data;
  }

  /**
   * this method is used to refresh the access token
   * @param refreshToken this is the refresh token that is returned from the idp
   * @returns accessToken, refreshToken
   */
  async refreshToken(refreshToken: string): Promise<IdpJwtResponse> {
    this.logger.log('refreshToken called');
    const url = this.idpUrl + '/token';
    const refreshResponse = await firstValueFrom(
      this.httpService
        .post<IdpJwtResponse>(
          url,
          {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: this.customConfigService.CLIENT_ID,
              password: this.customConfigService.CLIENT_SECRET,
            },
          },
        )
        .pipe(
          catchError((err) => {
            if (err instanceof AxiosError && err.response?.status === 401) {
              this.logger.debug('user invalid refresh token');
              throw new UnauthorizedException();
            }
            this.logger.error(err);
            throw new InternalServerErrorException();
          }),
        ),
    );
    this.logger.log('refreshToken success');
    return refreshResponse.data;
  }

  /**
   * this method is used to get the user info from the idp
   * @param accessToken this is the access token that is returned from the idp
   * @returns user info
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    this.logger.log('getUserInfo called');
    const url = this.idpUrl + '/userinfo';
    const userInfoResponse = await firstValueFrom(
      this.httpService
        .get<IdpUserInfoRes>(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .pipe(
          catchError((err) => {
            if (err instanceof AxiosError && err.response?.status === 401) {
              this.logger.debug('user invalid access token');
              throw new UnauthorizedException();
            }
            this.logger.error(err);
            throw new InternalServerErrorException();
          }),
        ),
    );
    this.logger.log('getUserInfo success');
    const {
      name,
      email,
      phone_number: phoneNumber,
      student_id: studentNumber,
      uuid,
    } = userInfoResponse.data;
    return { name, email, phoneNumber, studentNumber, uuid };
  }

  /**
   * this method is used to revoke the token from the idp
   * @param token this is the token that is returned from the idp
   */
  async revokeToken(token: string): Promise<void> {
    this.logger.log('revokeToken called');
    const url = this.idpUrl + '/revoke';
    await firstValueFrom(
      this.httpService
        .post(
          url,
          {
            token,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: this.customConfigService.CLIENT_ID,
              password: this.customConfigService.CLIENT_SECRET,
            },
          },
        )
        .pipe(
          catchError((err) => {
            if (err instanceof AxiosError && err.response?.status === 401) {
              this.logger.debug('user invalid token');
              throw new UnauthorizedException();
            }
            this.logger.error(err);
            throw new InternalServerErrorException();
          }),
        ),
    );
    this.logger.log('revokeToken success');
  }
}
