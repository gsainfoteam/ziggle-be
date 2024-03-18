import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { NoticeService } from './notice.service';
import { IdPGuard, IdPOptionalGuard } from 'src/user/guard/id.guard';
import { GeneralNoticeListDto } from './dto/res/generalNotice.dto';
import { GetAllNoticeQueryDto } from './dto/req/getAllNotice.dto';
import { User } from '@prisma/client';
import { GetUser } from 'src/user/decorator/get-user.decorator';
import { ExpandedGeneralNoticeDto } from './dto/res/expandedGeneralNotice.dto';
import { CreateNoticeDto } from './dto/req/createNotice.dto';
import { ForeignContentDto } from './dto/req/foreignContent.dto';
import { ReactionDto } from './dto/req/reaction.dto';
import { UpdateNoticeDto } from './dto/req/updateNotice.dto';

@ApiTags('notice')
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
    summary: 'Get all notice list',
    description: 'Get all notice list',
  })
  @ApiOkResponse({
    type: GeneralNoticeListDto,
    description: 'Return all notice list',
  })
  @Get('all')
  @UseGuards(IdPOptionalGuard)
  async getAllNoticeList(
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
    summary: 'Create notice',
    description: 'Create notice',
  })
  @ApiOkResponse({
    type: ExpandedGeneralNoticeDto,
    description: 'Return notice',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post()
  @UseGuards(IdPGuard)
  async createNotice(
    @GetUser() user: User,
    @Body() createNoticeDto: CreateNoticeDto,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.createNotice(createNoticeDto, user.uuid);
  }

  @ApiOperation({
    summary: 'Add additional notice',
    description: 'Add additional notice',
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
    @Body() additionalNoticeDto: CreateNoticeDto,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.addNoticeAdditional(
      additionalNoticeDto,
      id,
      user.uuid,
    );
  }

  @ApiOperation({
    summary: 'Add notice reminder',
    description: 'Add notice reminder',
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
    summary: 'Add notice reminder',
    description: 'Add notice reminder',
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
    summary: 'Add notice reminder',
    description: 'Add notice reminder',
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
    @Body() body: UpdateNoticeDto,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.updateNotice(body, id, user.uuid);
  }

  @Delete(':id/reminder')
  @UseGuards(IdPGuard)
  async deleteNoticeReminder(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.removeNoticeReminder(id, user.uuid);
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
