import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { User } from 'src/global/entity/user.entity';
import { UserInfo } from '../type/userInfo.type';

@Injectable()
export class IdpOptionalStrategy extends PassportStrategy(
  Strategy,
  'gistory-idp-optional',
) {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
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

    const user = await this.userRepository.findByUserUUID(userInfo.user_uuid);
    if (!user) {
      return;
    }

    user.name = userInfo.user_name;
    await user.save();

    return { ziggle: user, idp: userInfo };
  }
}
