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
    user: User, // TODO: jwt로 인증 방식 통합 후 user 타입으로 변경
    _: any,
    context: ExecutionContext,
  ): any {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    if (request.path === '/user/consent') {
      return user;
    }

    if (!user.consent) {
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
