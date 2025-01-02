import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { UserService } from '../user.service';
import { User } from '@prisma/client';
import { InfoteamIdpService } from '@lib/infoteam-idp';
import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';

@Injectable()
export class IdPStrategy extends PassportStrategy(Strategy, 'idp') {
  constructor(
    private readonly userService: UserService,
    private readonly infoTeamIdpService: InfoteamIdpService,
  ) {
    super();
  }

  async validate(token: string): Promise<{
    ziggle: User;
    idp: UserInfo;
    token: string;
  }> {
    const idp = await this.infoTeamIdpService.getUserInfo(token).catch(() => {
      throw new UnauthorizedException();
    });
    const ziggle = await this.userService
      .findUserOrCreate({
        uuid: idp.uuid,
        name: idp.name,
      })
      .catch(() => {
        throw new UnauthorizedException();
      });
    return { ziggle, idp, token };
  }
}
