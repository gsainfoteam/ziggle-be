import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetIdPUser = createParamDecorator(
  (data, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.idp;
  },
);
