import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.ziggle;
  },
);
