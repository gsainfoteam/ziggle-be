import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { GroupsToken } from './types/groupsToken.type';
import { GroupInfo } from './types/groupinfo.type';

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);
  private groupsUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.groupsUrl = this.configService.getOrThrow<string>('GROUPS_URL');
  }

  async getExternalTokenFromGroups(accessToken: string): Promise<GroupsToken> {
    this.logger.log('getGroupFromVapor called');
    const groupResponse = await firstValueFrom(
      this.httpService.post<{
        token: string;
      }>(
        this.groupsUrl + '/external',
        {
          idpToken: accessToken,
        },
        {
          auth: {
            username: this.configService.getOrThrow<string>('GROUPS_CLIENT_ID'),
            password: this.configService.getOrThrow<string>(
              'GROUPS_CLIENT_SECRET',
            ),
          },
        },
      ),
    ).catch((error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          this.logger.debug('Unauthorized');
          throw new UnauthorizedException();
        } else if (error.response?.status === 500) {
          this.logger.error('Internal Server Error');
          throw new InternalServerErrorException();
        }
      }
      this.logger.error(error);
      throw new InternalServerErrorException();
    });

    return {
      groupsToken: groupResponse.data.token,
    };
  }

  async getGroupInfoFromGroups(groupsToken: string): Promise<GroupInfo[]> {
    this.logger.log('getGroupInfoFromGroups called');
    const groupResponse = await firstValueFrom(
      this.httpService.get<{ list: GroupInfo[] }>(this.groupsUrl + '/info', {
        headers: {
          Authorization: `Bearer ${groupsToken}`,
        },
      }),
    ).catch((error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          this.logger.debug('Unauthorized');
          throw new UnauthorizedException();
        } else if (error.response?.status === 500) {
          this.logger.error('Internal Server Error');
          throw new InternalServerErrorException();
        }
      }
      this.logger.error(error);
      throw new InternalServerErrorException();
    });

    return groupResponse.data.list;
  }
}
