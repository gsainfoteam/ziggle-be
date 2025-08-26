import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GroupsUserInfo } from '@lib/infoteam-groups/types/groups.type';

export const GetGroups = createParamDecorator(
  (_data, ctx: ExecutionContext): GroupsUserInfo[] | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.groups;
  },
);
