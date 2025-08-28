import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsUserInfo } from '../types/groups.type';

@Injectable()
export class GroupsGuard extends AuthGuard('groups') {
  handleRequest(
    err: Error,
    user: { groups: GroupsUserInfo[] },
    _: any,
    context: ExecutionContext,
  ): any {
    if (err) {
      throw new UnauthorizedException();
    }
    const request = context.switchToHttp().getRequest();
    request.groups = user.groups;
    return true;
  }
}
