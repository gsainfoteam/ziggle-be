import { HttpService } from '@nestjs/axios';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { GroupsToken } from './types/groupsToken.type';
import { Loggable } from '@lib/logger/decorator/loggable';
import { GroupInfo } from './types/groupInfo.type';
import { CustomConfigService } from '@lib/custom-config';
import { GetGroupByNameQueryDto } from './dto/req/getGroup.dto';
import { GroupListResDto } from './dto/res/GroupsRes.dto';

@Injectable()
@Loggable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);
  private readonly groupsUrl: string;
  private readonly groupsClientId: string;
  private readonly groupsClientSecret: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.groupsUrl = this.customConfigService.GROUPS_URL;
    this.groupsClientId = this.customConfigService.GROUPS_CLIENT_ID;
    this.groupsClientSecret = this.customConfigService.GROUPS_CLIENT_SECRET;
  }

  async getExternalTokenFromGroups(accessToken: string): Promise<GroupsToken> {
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
            username: this.groupsClientId,
            password: this.groupsClientSecret,
          },
        },
      ),
    ).catch((error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          this.logger.debug('Unauthorized');
          throw new UnauthorizedException();
        } else if (error.response?.status === 403) {
          this.logger.debug('Forbidden');
          throw new ForbiddenException();
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
    const groupResponse = await firstValueFrom(
      this.httpService.get<{ list: GroupInfo[] }>(
        this.groupsUrl + '/external/info',
        {
          headers: {
            Authorization: `Bearer ${groupsToken}`,
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

    return groupResponse.data.list;
  }

  async getGroupListByNamequeryFromGroups(
    groupNameQuery: GetGroupByNameQueryDto,
  ): Promise<GroupListResDto> {
    const groupResponse = await firstValueFrom(
      this.httpService.get<GroupListResDto>(this.groupsUrl + '/group/search', {
        params: groupNameQuery,
        auth: {
          username: this.groupsClientId,
          password: this.groupsClientSecret,
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

    return {
      list: groupResponse.data.list,
    };
  }
}
