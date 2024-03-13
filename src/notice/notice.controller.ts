import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NoticeService } from './notice.service';
import { IdPOptionalGuard } from 'src/user/guard/id.guard';
import { GeneralNoticeListDto } from './dto/res/generalNotice.dto';
import { GetAllNoticeQueryDto } from './dto/req/getAllNotice.dto';
import { User } from '@prisma/client';
import { GetUser } from 'src/user/decorator/get-user.decorator';
import { ExpandedGeneralNoticeDto } from './dto/res/expandedGeneralNotice.dto';

@ApiTags('notice')
@Controller('notice')
@UsePipes(new ValidationPipe({ transform: true }))
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Get()
  @UseGuards(IdPOptionalGuard)
  async getNoticeList(
    @Query() query: GetAllNoticeQueryDto,
    @GetUser() user?: User,
  ): Promise<GeneralNoticeListDto> {
    return this.noticeService.getNoticeList(query, user?.uuid);
  }

  @Get('all')
  @UseGuards(IdPOptionalGuard)
  async getAllNoticeList(
    @Query() query: GetAllNoticeQueryDto,
    @GetUser() user?: User,
  ): Promise<GeneralNoticeListDto> {
    return this.noticeService.getNoticeList(query, user?.uuid);
  }

  @Get(':id')
  @UseGuards(IdPOptionalGuard)
  async getNotice(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetAllNoticeQueryDto,
    @GetUser() user?: User,
  ): Promise<ExpandedGeneralNoticeDto> {
    return this.noticeService.getNotice(id, query, user?.uuid);
  }
}
