import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { UserService } from '../user.service';
import { User } from '@prisma/client';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';

@Injectable()
export class IdPOptionalStrategy extends PassportStrategy(
  Strategy,
  'idp-optional',
) {
  constructor(
    private readonly userService: UserService,
    private readonly infoteamIdpService: InfoteamIdpService,
  ) {
    super();
  }

  async validate(token: string): Promise<{
    ziggle: User;
    idp: UserInfo;
  } | void> {
    const idp = await this.infoteamIdpService.getUserInfo(token).catch(() => {
      return undefined;
    });
    if (!idp) return undefined;
    const ziggle = await this.userService
      .findUserOrCreate({
        uuid: idp.uuid,
        name: idp.name,
      })
      .catch(() => {
        undefined;
      });
    if (!ziggle) return undefined;
    return { ziggle, idp };
  }
}
