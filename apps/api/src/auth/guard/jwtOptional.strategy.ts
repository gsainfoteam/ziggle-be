import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { CustomConfigService } from '@lib/custom-config';

@Injectable()
export class JwtOptionalStrategy extends PassportStrategy(
  Strategy,
  'jwt-optional',
) {
  constructor(
    private readonly authService: AuthService,
    private readonly customConfigService: CustomConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: customConfigService.JWT_SECRET,
      issuer: customConfigService.JWT_ISSUER,
      audience: customConfigService.JWT_AUDIENCE,
    });
  }

  async validate({ sub }: JwtPayload): Promise<User | void> {
    if (!sub) return undefined;
    return this.authService.findUserByUuid(sub).catch(() => {
      return undefined;
    });
  }
}
