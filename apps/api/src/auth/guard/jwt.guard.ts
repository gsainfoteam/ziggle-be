import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@generated/prisma/client';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  override handleRequest(
    err: any,
    user: User,
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
      throw new ForbiddenException('Consent required');
    }

    return user;
  }
}

@Injectable()
export class JwtOptionalGuard extends AuthGuard([
  'jwt-optional',
  'anonymous',
]) {}
