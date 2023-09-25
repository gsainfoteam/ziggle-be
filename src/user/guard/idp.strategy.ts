import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { UserService } from '../user.service';
import { UserInfo } from '../type/userInfo.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class IdPStrategy extends PassportStrategy(Strategy, 'gistory-idp') {
  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async validate(token: string): Promise<{
    ziggle: User;
    idp: UserInfo;
  }> {
    // validate token with idp server
    const userInfo = await this.userService.getUserInfoFromIdP(token);
    if (!userInfo) {
      throw new UnauthorizedException('Invalid token');
    }

    //validate userUUID with user table
    const user = await this.prismaService.user.findUnique({
      where: { uuid: userInfo.user_uuid },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid user');
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
