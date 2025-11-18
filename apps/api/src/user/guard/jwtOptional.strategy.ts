import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UserService } from '../user.service';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '@prisma/client';

@Injectable()
export class JwtOptionalStrategy extends PassportStrategy(
  Strategy,
  'idp-optional',
) {
  constructor(private readonly userService: UserService) {
    super();
  }

  async validate({ sub }: JwtPayload): Promise<User | void> {
    if (!sub) return undefined;
    return this.userService.findUserByUuid(sub).catch(() => {
      undefined;
    });
  }
}
