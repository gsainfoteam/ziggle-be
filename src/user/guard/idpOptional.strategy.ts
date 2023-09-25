import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { UserService } from '../user.service';
import { UserInfo } from '../type/userInfo.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class IdpOptionalStrategy extends PassportStrategy(
  Strategy,
  'gistory-idp-optional',
) {
  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async validate(
    token: string,
  ): Promise<{ ziggle: User; idp: UserInfo } | void> {
    const userInfo = await this.userService
      .getUserInfoFromIdP(token)
      .catch(() => undefined);

    if (!userInfo) {
      return;
    }

    const user = await this.prismaService.user.findUnique({
      where: { uuid: userInfo.user_uuid },
    });
    if (!user) {
      return;
    }
    if (user.name !== userInfo.user_name) {
      await this.prismaService.user.update({
        where: { uuid: userInfo.user_uuid },
        data: { name: userInfo.user_name },
      });
    }
    return { ziggle: user, idp: userInfo };
  }
}
