import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetGroups = createParamDecorator(
  (_data, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.groups;
  },
);
