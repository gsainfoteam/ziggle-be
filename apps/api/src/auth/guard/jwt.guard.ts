import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@generated/prisma/client';

@Injectable()
// export class JwtGuard extends AuthGuard('jwt') {}
export class JwtGuard extends AuthGuard(['jwt', 'idp']) {
  override handleRequest(
    err: any,
    user: any, // TODO: jwt로 인증 방식 통합 후 user 타입으로 변경
    info: any,
    context: ExecutionContext,
  ): any {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    if (request.url.includes('/user/consent')) {
      return user;
    }

    const effectiveUser = user.ziggle || user;

    if (!effectiveUser.consent) {
      throw new UnauthorizedException('Consent required');
    }

    return user;
  }
}

@Injectable()
export class JwtOptionalGuard extends AuthGuard([
  'jwt-optional',
  'idp-optional',
  'anonymous',
]) {}
