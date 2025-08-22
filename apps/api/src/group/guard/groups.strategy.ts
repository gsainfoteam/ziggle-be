import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { InfoteamGroupsService } from 'libs/infoteam-groups/src/infoteam-groups.service';
import { Request } from 'express';
import { GroupsUserInfo } from 'libs/infoteam-groups/src/types/groups.type';

@Injectable()
export class GroupsStrategy extends PassportStrategy(Strategy, 'groups') {
  constructor(private readonly infoteamGroupsService: InfoteamGroupsService) {
    super();
  }

  async validate(req: Request): Promise<GroupsUserInfo | void> {
    const token = req.get('groups-token');
    if (!token) return;
    const groups = await this.infoteamGroupsService.getGroupsUserInfo(token);
    return { groups };
  }
}
