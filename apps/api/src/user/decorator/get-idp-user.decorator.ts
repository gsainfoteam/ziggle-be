import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetIdPUser = createParamDecorator(
  (_data, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.idp;
  },
);
