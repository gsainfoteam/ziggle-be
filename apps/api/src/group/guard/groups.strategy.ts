import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { InfoteamGroupsService } from 'libs/infoteam-groups/src/infoteam-groups.service';
import { GroupsUserInfo } from 'libs/infoteam-groups/src/types/groupsUserInfo.type';

@Injectable()
export class GroupsStrategy extends PassportStrategy(Strategy, 'groups') {
  constructor(private readonly infoteamGroupsService: InfoteamGroupsService) {
    super();
  }

  async validate(token: string): Promise<GroupsUserInfo> {
    const group = this.infoteamGroupsService.getGroupsUserInfo(token);
    return group;
  }
}
