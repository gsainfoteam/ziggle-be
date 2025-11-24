import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { IdpJwtResponse, IdpUserInfoResponse } from './types/idp.type';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { UserInfo } from './types/userInfo.type';
import { CustomConfigService } from '@lib/custom-config';

@Injectable()
export class InfoteamIdpService {
  private readonly logger = new Logger(InfoteamIdpService.name, {
    timestamp: true,
  });
  private readonly idpUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.idpUrl = this.customConfigService.IDP_URL;
  }

  /**
   * this method is used to get the user info from the idp
   * @param accessToken it is the access token that is returned from the idp
   * @returns userInfo
   * @throws UnauthorizedException if the access token is invalid
   * @throws InternalServerErrorException if there is an unknown error while getting the user info
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
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
    const {
      sub: uuid,
      name,
      email,
      picture,
      student_id: studentNumber,
    } = userInfoResponse.data;
    return { uuid, name, email, picture: picture ?? null, studentNumber };
  }

  //deprecated
  async refresh(refreshToken: string): Promise<IdpJwtResponse> {
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
              username: this.customConfigService.CLIENT_ID,
              password: this.customConfigService.CLIENT_SECRET,
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
    return accessTokenResponse.data;
  }

  // deprecated
  async revoke(token: string): Promise<void> {
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
              username: this.customConfigService.CLIENT_ID,
              password: this.customConfigService.CLIENT_SECRET,
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
  }
}
