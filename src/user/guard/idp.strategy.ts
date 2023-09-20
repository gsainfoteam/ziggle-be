import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { User } from 'src/global/entity/user.entity';
import { UserInfo } from '../type/userInfo.type';

@Injectable()
export class IdPStrategy extends PassportStrategy(Strategy, 'gistory-idp') {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
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
    const user = await this.userRepository.findByUserUUID(userInfo.user_uuid);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    user.name = userInfo.user_name;
    await user.save();

    return { ziggle: user, idp: userInfo };
  }
}
