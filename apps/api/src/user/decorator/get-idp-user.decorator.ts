import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetIdPUser = createParamDecorator(
  (_data, ctx: ExecutionContext): UserInfo | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.idp;
  },
);
