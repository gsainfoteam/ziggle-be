import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
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

  async getGroupByUuid(uuid: string): Promise<GroupInfo> {
    const groupResponse = await firstValueFrom(
      this.httpService.get<GroupInfo>(`${this.groupsUrl}/group/${uuid}`, {
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
        } else if (error.response?.status === 404) {
          this.logger.debug('Group not found');
          throw new NotFoundException('Group not found');
        } else if (error.response?.status === 500) {
          this.logger.error('Internal Server Error');
          throw new InternalServerErrorException();
        }
      }
      this.logger.error(error);
      throw new InternalServerErrorException();
    });

    return groupResponse.data;
  }
}
