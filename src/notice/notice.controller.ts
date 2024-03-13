import {
  Controller,
  Get,
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

@ApiTags('notice')
@Controller('notice')
@UsePipes(new ValidationPipe({ transform: true }))
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}
}
