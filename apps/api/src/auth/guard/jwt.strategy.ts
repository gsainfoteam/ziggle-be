import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { ExtractJwt } from 'passport-jwt';
import { User } from '@generated/prisma/client';
import { AccountService } from '../account';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
  ) {
    super();
  }

  async validate(req: Request): Promise<User> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const session = token
      ? await this.accountService.verifySession(token)
      : null;
    if (!session) throw new UnauthorizedException('invalid token');
    return await this.authService.findUserByUuid(session.sub).catch(() => {
      throw new UnauthorizedException();
    });
  }
}
