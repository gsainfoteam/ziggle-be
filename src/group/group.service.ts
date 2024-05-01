import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Group } from './types/group.type';

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);
  private vaporUrl: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.vaporUrl = this.configService.getOrThrow<string>('VAPOR_URL');
  }

  async getGroupFromVapor(
    groupName: string,
    accessToken: string,
  ): Promise<Group | null> {
    this.logger.log('getGroupFromVapor called');
    const url = this.vaporUrl + `/group/${groupName}`;
    const groupResponse = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    ).catch((err) => {
      if (err instanceof AxiosError && err.response?.status === 404) {
        return null;
      }
      this.logger.error(err);
      throw new InternalServerErrorException();
    });

    return groupResponse?.data;
  }
}
