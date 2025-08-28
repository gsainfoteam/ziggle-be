import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomConfigService } from '@lib/custom-config';
import { catchError, firstValueFrom } from 'rxjs';
import { GroupsUserInfo } from './types/groups.type';
import { AxiosError } from 'axios';

@Injectable()
export class InfoteamGroupsService {
  private readonly logger = new Logger(InfoteamGroupsService.name, {
    timestamp: true,
  });
  private readonly groupsUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.groupsUrl = this.customConfigService.GROUPS_URL;
  }

  async getGroupsUserInfo(accessToken: string): Promise<GroupsUserInfo[]> {
    const userInfoResponse = await firstValueFrom(
      this.httpService
        .get<GroupsUserInfo[]>(this.groupsUrl + '/third-party/userinfo', {
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

    return userInfoResponse.data;
  }
}
