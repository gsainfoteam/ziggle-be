import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsUserInfo } from 'libs/infoteam-groups/src/types/groups.type';

@Injectable()
export class GroupsGuard extends AuthGuard('groups') {
  handleRequest(
    err: Error,
    user: GroupsUserInfo,
    _: any,
    context: ExecutionContext,
  ): any {
    if (err) {
      throw new UnauthorizedException();
    }
    const request = context.switchToHttp().getRequest();
    request.groups = user;
    return true;
  }
}
