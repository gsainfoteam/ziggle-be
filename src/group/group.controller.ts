import { Controller, Post, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { IdPGuard } from 'src/user/guard/idp.guard';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetToken } from 'src/user/decorator/get-token.decorator';
import { GroupsTokenRes } from './dto/res/GroupsTokenRes.dto';

@ApiTags('Group')
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @ApiOperation({
    summary: 'Get groups token',
    description: 'Get groups token',
  })
  @ApiCreatedResponse({
    type: GroupsTokenRes,
    description: 'Groups token',
  })
  @ApiUnauthorizedResponse()
  @ApiInternalServerErrorResponse()
  @Post('token')
  @UseGuards(IdPGuard)
  async getGroupsToken(@GetToken() token: string): Promise<GroupsTokenRes> {
    return this.groupService.getExternalTokenFromGroups(token);
  }
}
