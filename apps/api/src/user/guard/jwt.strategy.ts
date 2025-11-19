import { CustomConfigService } from '@lib/custom-config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userService: UserService,
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
    return this.userService.findUserByUuid(sub).catch(() => {
      throw new UnauthorizedException();
    });
  }
}
