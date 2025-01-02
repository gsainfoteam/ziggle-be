import { ApiProperty } from '@nestjs/swagger';

export class GroupsTokenRes {
  @ApiProperty()
  groupsToken: string;
}
