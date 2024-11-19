import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { NoticeService } from './notice.service';
import { IdPGuard, IdPOptionalGuard } from 'src/user/guard/idp.guard';
import { GeneralNoticeListDto } from './dto/res/generalNotice.dto';
import { GetAllNoticeQueryDto } from './dto/req/getAllNotice.dto';
import { User } from '@prisma/client';
import { GetUser } from 'src/user/decorator/get-user.decorator';
import { ExpandedGeneralNoticeDto } from './dto/res/expandedGeneralNotice.dto';
import { CreateNoticeDto } from './dto/req/createNotice.dto';
import { ForeignContentDto } from './dto/req/foreignContent.dto';
import { ReactionDto } from './dto/req/reaction.dto';
import {
  UpdateNoticeDto,
  UpdateNoticeQueryDto,
} from './dto/req/updateNotice.dto';
import { AdditionalNoticeDto } from './dto/req/additionalNotice.dto';
import { GetGroupNoticeQueryDto } from './dto/req/getGroupNotice.dto';

@ApiTags('notice')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
@Controller('notice')
@UsePipes(new ValidationPipe({ transform: true }))
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @ApiOperation({
    summary: 'Get notice list',
    description: 'Get notice list',
  })
  @ApiOkResponse({
    type: GeneralNoticeListDto,
    description: 'Return notice list',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get()
  @UseGuards(IdPOptionalGuard)
  async getNoticeList(
    @Query() query: GetAllNoticeQueryDto,
    @GetUser() user?: User,
  ): Promise<GeneralNoticeListDto> {
    return this.noticeService.getNoticeList(query, user?.uuid);
  }

  @ApiOperation({
    summary: 'Get notice',
    description: 'Get notice',
  })
  @ApiOkResponse({
    type: ExpandedGeneralNoticeDto,
    description: 'Return notice',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get(':id')
  @UseGuards(IdPOptionalGuard)
  async getNotice(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetAllNoticeQueryDto,
    @GetUser() user?: User,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.getNotice(id, query, user?.uuid);
  }

  @ApiOperation({
    summary: 'Get group notice list',
    description: 'Get group notice list',
  })
  @ApiOkResponse({
    type: GeneralNoticeListDto,
    description: 'Return group notice list',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('group/:id')
  @UseGuards(IdPOptionalGuard)
  async getGroupNoticeList(
    @Param('id') groupId: string,
    @Query() query: GetGroupNoticeQueryDto,
    @GetUser() user?: User,
  ): Promise<GeneralNoticeListDto> {
    const result = await this.noticeService.getGroupNoticeList(
      groupId,
      query,
      user?.uuid,
    );
    return result;
  }

  @ApiOperation({
    summary: 'Create notice',
    description: 'Create notice',
  })
  @ApiOkResponse({
    type: ExpandedGeneralNoticeDto,
    description: 'Return notice',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiHeader({
    name: 'Groups-Token',
    description: 'Groups-Token',
    required: false,
  })
  @Post()
  @UseGuards(IdPGuard)
  async createNotice(
    @GetUser() user: User,
    @Body() createNoticeDto: CreateNoticeDto,
    @Headers('Groups-Token') groupToken?: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.createNotice(
      createNoticeDto,
      user.uuid,
      groupToken,
    );
  }

  @ApiOperation({
    summary: 'Send notice alarm',
    description: 'Send notice alarm when new notice is created',
  })
  @ApiOkResponse({ description: 'Return notice' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post(':id/alarm')
  @UseGuards(IdPGuard)
  async sendNotice(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.sendNotice(id, user.uuid);
  }

  @ApiOperation({
    summary: 'Write additional notice',
    description: 'Write additional notice',
  })
  @ApiOkResponse({
    type: ExpandedGeneralNoticeDto,
    description: 'Return notice',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post(':id/additional')
  @UseGuards(IdPGuard)
  async createAdditionalNotice(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
    @Body() additionalNoticeDto: AdditionalNoticeDto,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.addNoticeAdditional(
      additionalNoticeDto,
      id,
      user.uuid,
    );
  }

  @ApiOperation({
    summary: 'Write foreign content',
    description: 'Write notice contents for foreigners',
  })
  @ApiOkResponse({
    type: ExpandedGeneralNoticeDto,
    description: 'Return notice',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post(':id/:contentIdx/foreign')
  @UseGuards(IdPGuard)
  async addForeignContent(
    @Param('id', ParseIntPipe) id: number,
    @Param('contentIdx', ParseIntPipe) contentIdx: number,
    @GetUser() user: User,
    @Body() foreignContentDto: ForeignContentDto,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.addForeignContent(
      foreignContentDto,
      id,
      contentIdx,
      user.uuid,
    );
  }

  @ApiOperation({
    summary: 'Add reaction',
    description: 'Add reaction to the notice',
  })
  @ApiOkResponse({
    type: ExpandedGeneralNoticeDto,
    description: 'Return notice',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post(':id/reaction')
  @UseGuards(IdPGuard)
  async addReaction(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReactionDto,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.addNoticeReaction(body, id, user.uuid);
  }

  @ApiOperation({
    summary: 'modify notice content',
    description: 'modify notice content',
  })
  @ApiOkResponse({
    type: ExpandedGeneralNoticeDto,
    description: 'Return notice',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch(':id')
  @UseGuards(IdPGuard)
  async updateNotice(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
    @Query() query: UpdateNoticeQueryDto,
    @Body() body: UpdateNoticeDto,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.updateNotice(body, query, id, user.uuid);
  }

  @ApiOperation({
    summary: 'Delete notice reaction',
    description: 'Delete notice reaction',
  })
  @ApiOkResponse({
    type: ExpandedGeneralNoticeDto,
    description: 'Return notice',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Delete(':id/reaction')
  @UseGuards(IdPGuard)
  async deleteReaction(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReactionDto,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.removeNoticeReaction(body, id, user.uuid);
  }

  @ApiOperation({
    summary: 'Delete notice',
    description: 'Delete notice',
  })
  @ApiOkResponse({ description: 'Return notice' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Delete(':id')
  @UseGuards(IdPGuard)
  async deleteNotice(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.noticeService.deleteNotice(id, user.uuid);
  }
}
