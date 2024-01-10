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
import { CreateNoticeDto } from './dto/createNotice.dto';
import { NoticeService } from './notice.service';
import { IdPGuard, IdPOptionalGuard } from 'src/user/guard/idp.guard';
import { GetAllNoticeQueryDto } from './dto/getAllNotice.dto';
import { GetUser } from 'src/user/decorator/get-user.decorator';
import { User } from '@prisma/client';
import { AdditionalNoticeDto } from './dto/additionalNotice.dto';
import { ForeignContentDto } from './dto/foreignContent.dto';
import { ApiTags } from '@nestjs/swagger';
import { GetNoticeDto } from './dto/getNotice.dto';
import { UpdateNoticeDto } from './dto/updateNotice.dto';

@ApiTags('notice')
@Controller('notice')
@UsePipes(new ValidationPipe({ transform: true }))
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  /* notice 전체 목록 조회 (페이지네이션 o) */
  @Get()
  @UseGuards(IdPOptionalGuard)
  async getNoticeList(
    @Query() getAllNoticeQueryDto: GetAllNoticeQueryDto,
    @GetUser() user?: User,
  ) {
    return this.noticeService.getNoticeList(getAllNoticeQueryDto, user?.uuid);
  }

  @Get('all')
  @UseGuards(IdPOptionalGuard)
  async getAllNoticeList(
    @Query() getAllNoticeQueryDto: GetAllNoticeQueryDto,
    @GetUser() user?: User,
  ) {
    return this.noticeService.getNoticeList(getAllNoticeQueryDto, user?.uuid);
  }

  /* notice 상세 조회 */
  @Get(':id')
  @UseGuards(IdPOptionalGuard)
  async getNotice(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetNoticeDto,
    @GetUser() user?: User,
  ) {
    return this.noticeService.getNotice(id, query, user?.uuid);
  }

  /* notice 생성 */
  @Post()
  @UseGuards(IdPGuard)
  async createNotice(
    @GetUser() user: User,
    @Body() createNoticeDto: CreateNoticeDto,
  ) {
    return this.noticeService.createNotice(createNoticeDto, user.uuid);
  }

  @Post(':id/additional')
  @UseGuards(IdPGuard)
  async addNoticeAdditional(
    @Param('id') id: number,
    @GetUser() user: User,
    @Body() additionalNoticeDto: AdditionalNoticeDto,
  ) {
    return this.noticeService.addNoticeAdditional(
      additionalNoticeDto,
      id,
      user.uuid,
    );
  }

  @Post(':id/:contentIdx/foreign')
  @UseGuards(IdPGuard)
  async addForeignContent(
    @Param('id') id: number,
    @Param('contentIdx') idx: number,
    @GetUser() user: User,
    @Body() foreignContentDto: ForeignContentDto,
  ) {
    return this.noticeService.addForeignContent(
      foreignContentDto,
      id,
      idx,
      user?.uuid,
    );
  }

  /* notice 구독자 추가 notice 수정이 아니므로 작성자가 아니어도 가능 */
  @Post(':id/reminder')
  @UseGuards(IdPGuard)
  async addNoticeReminder(@GetUser() user: User, @Param('id') id: number) {
    return this.noticeService.addNoticeReminder(id, user?.uuid);
  }

  /* notice 수정은 작성자만 가능, 15분 이내에만 가능 */
  @Patch(':id')
  @UseGuards(IdPGuard)
  async updateNotice(
    @Param('id') id: number,
    @GetUser() user: User,
    @Body() body: UpdateNoticeDto,
  ) {
    return this.noticeService.updateNotice(id, body, user.uuid);
  }

  @Delete(':id/reminder')
  @UseGuards(IdPGuard)
  async deleteNoticeReminder(@GetUser() user: User, @Param('id') id: number) {
    return this.noticeService.removeNoticeReminder(id, user?.uuid);
  }

  /* notice 삭제는 작성자만 가능 */
  @Delete(':id')
  @UseGuards(IdPGuard)
  async deleteNotice(
    @GetUser() user: User,
    @Param('id') id: number,
  ): Promise<void> {
    return this.noticeService.deleteNotice(id, user.uuid);
  }
}
