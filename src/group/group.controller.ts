import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { IdPGuard } from 'src/user/guard/idp.guard';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetToken } from 'src/user/decorator/get-token.decorator';
import { GroupsTokenRes } from './dto/res/GroupsTokenRes.dto';
import { GroupListResDto } from './dto/res/GroupsRes.dto';
import { GetGroupByNameQueryDto } from './dto/req/getGroup.dto';

@ApiTags('Group')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
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

  @ApiOperation({
    summary: 'Searching group list',
    description: 'Seaching group list by nmae query',
  })
  @ApiCreatedResponse({
    type: GroupListResDto,
    description: '검색된 그룹 목록',
  })
  @ApiUnauthorizedResponse()
  @ApiInternalServerErrorResponse()
  @Get('search')
  async getGroupListByNamequeryFromGroups(
    @Query() groupNameQuery: GetGroupByNameQueryDto,
  ): Promise<GroupListResDto> {
    return this.groupService.getGroupListByNamequeryFromGroups(groupNameQuery);
  }
}
