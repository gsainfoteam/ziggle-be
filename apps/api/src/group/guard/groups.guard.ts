import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsUserInfo } from 'libs/infoteam-groups/src/types/groupsUserInfo.type';

@Injectable()
export class GroupsGuard extends AuthGuard('groups') {
  handleRequest(
    err: any,
    user: GroupsUserInfo,
    info: any,
    context: ExecutionContext,
  ): any {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    const request = context.switchToHttp().getRequest();
    request.groupsUser = user;
    return true;
  }
}
