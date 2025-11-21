import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user.ziggle) return req.user;
    return req.user.ziggle;
  },
);
