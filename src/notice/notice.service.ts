import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetAllNoticeQueryDto } from './dto/req/getAllNotice.dto';
import { User } from '@prisma/client';
import { GeneralNoticeListDto } from './dto/res/generalNotice.dto';
import { NoticeRepository } from './notice.repository';
import { NoticeMapper } from './notice.mapper';

@Injectable()
export class NoticeService {
  private readonly loggger = new Logger(NoticeService.name);
  private readonly s3Url: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly noticeRepository: NoticeRepository,
    private readonly noticeMapper: NoticeMapper,
  ) {
    this.s3Url = `https://s3.${configService.get<string>(
      'AWS_S3_REGION',
    )}.amazonaws.com/${configService.get<string>('AWS_S3_BUCKET_NAME')}/`;
  }

  async getNoticeList(
    getAllNoticeDto: GetAllNoticeQueryDto,
    { uuid }: User,
  ): Promise<GeneralNoticeListDto> {
    this.loggger.log(`getNoticeList called`);
  }
}
