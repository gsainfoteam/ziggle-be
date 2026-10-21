import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@generated/prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user?: User }>();

    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.isAdmin) {
      throw new ForbiddenException('Admin permission required');
    }

    return true;
  }
}
