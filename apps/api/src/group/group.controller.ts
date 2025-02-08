import {
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GroupsTokenRes } from './dto/res/GroupsTokenRes.dto';
import { GroupListResDto, GroupResDto } from './dto/res/GroupsRes.dto';
import { GetGroupByNameQueryDto } from './dto/req/getGroup.dto';
import { IdPGuard } from '../user/guard/idp.guard';
import { GetToken } from '../user/decorator/get-token.decorator';
import { GroupInfo } from './types/groupInfo.type';

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
    description: 'Searching group list by name query',
  })
  @ApiOkResponse({
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

  @ApiOperation({
    summary: 'Get the list and information of groups I belong to',
    description: 'Get the list and information of groups I belong to',
  })
  @ApiOkResponse({
    type: GroupListResDto,
    description: '내가 속한 그룹의 목록과 정보',
  })
  @ApiUnauthorizedResponse()
  @ApiInternalServerErrorResponse()
  @ApiHeader({
    name: 'Groups-Token',
    description: 'Groups-Token',
    required: false,
  })
  @Get('my')
  @UseGuards(IdPGuard)
  async getGroupInfoFromGroups(
    @Headers('Groups-Token') groupToken: string,
  ): Promise<GroupInfo[]> {
    return this.groupService.getGroupInfoFromGroups(groupToken);
  }

  @ApiOperation({
    summary: 'Get group info by UUID',
    description: 'Get detailed information about a specific group',
  })
  @ApiOkResponse({
    type: GroupResDto,
    description: '특정 그룹의 상세 정보',
  })
  @ApiUnauthorizedResponse()
  @ApiInternalServerErrorResponse()
  @Get(':uuid')
  async getGroupByUuid(@Param('uuid') uuid: string): Promise<GroupInfo> {
    return this.groupService.getGroupByUuid(uuid);
  }
}
