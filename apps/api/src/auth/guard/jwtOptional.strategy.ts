import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { ExtractJwt } from 'passport-jwt';
import { User } from '@generated/prisma/client';
import { AccountService } from '../account';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtOptionalStrategy extends PassportStrategy(
  Strategy,
  'jwt-optional',
) {
  constructor(
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
  ) {
    super();
  }

  async validate(req: Request): Promise<User | void> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const session = token
      ? await this.accountService.verifySession(token)
      : null;
    if (!session) return undefined;
    return this.authService.findUserByUuid(session.sub).catch((err) => {
      if (err instanceof NotFoundException) return undefined;
      throw err;
    });
  }
}
