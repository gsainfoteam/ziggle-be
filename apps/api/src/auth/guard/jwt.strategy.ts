import { CustomConfigService } from '@lib/custom-config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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

  async validate({ sub }: JwtPayload) {
    if (!sub) throw new UnauthorizedException('invalid token');
    return await this.authService.findUserByUuid(sub).catch(() => {
      throw new UnauthorizedException();
    });
  }
}
