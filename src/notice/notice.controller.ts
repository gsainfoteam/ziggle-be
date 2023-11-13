import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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

  /* notice 상세 조회 */
  @Get(':id')
  @UseGuards(IdPOptionalGuard)
  async getNotice(@Param('id') id: number, @GetUser() user?: User) {
    return this.noticeService.getNotice(id, user?.uuid);
  }

  /* notice 생성 */
  @Post()
  //@UseGuards(IdPGuard)
  async createNotice(
    //@GetUser() user: User,
    @Body() createNoticeDto: CreateNoticeDto,
  ) {
    return this.noticeService.createNotice(
      createNoticeDto,
      '26fdf01a-1aa3-4e65-97ba-de2f0e6a9cc5',
    );
  }

  @Post(':id/additional')
  async addNoticeAdditional(@Param('id') id: number) {
    return;
  }

  @Post(':id/:contentIdx/forign')
  async addForignContent(
    @Param('id') id: number,
    @Param('contentIdx') idx: number,
  ) {
    return;
  }

  /* notice 구독자 추가 notice 수정이 아니므로 작성자가 아니어도 가능 */
  @Put(':id/reminder')
  @UseGuards(IdPGuard)
  async addNoticeReminder(@GetUser() user: User, @Param('id') id: number) {
    return this.noticeService.addNoticeReminder(id, user);
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
