import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetAllNoticeQueryDto } from './dto/req/getAllNotice.dto';
import { GeneralNoticeListDto } from './dto/res/generalNotice.dto';
import { NoticeRepository } from './notice.repository';
import { NoticeMapper } from './notice.mapper';
import { GetNoticeDto } from './dto/req/getNotice.dto';
import { ExpandedGeneralNoticeDto } from './dto/res/expandedGeneralNotice.dto';
import { NoticeFullContent } from './types/noticeFullContent';
import { CreateNoticeDto } from './dto/req/createNotice.dto';
import { ImageService } from 'src/image/image.service';
import { DocumentService } from 'src/document/document.service';

@Injectable()
export class NoticeService {
  private readonly loggger = new Logger(NoticeService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly imageService: ImageService,
    private readonly documentService: DocumentService,
    private readonly noticeRepository: NoticeRepository,
    private readonly noticeMapper: NoticeMapper,
  ) {}

  async getNoticeList(
    getAllNoticeQueryDto: GetAllNoticeQueryDto,
    userUuid?: string,
  ): Promise<GeneralNoticeListDto> {
    const notices = (
      await this.noticeRepository.getNoticeList(getAllNoticeQueryDto, userUuid)
    ).map((notice) =>
      this.noticeMapper.NoticeFullContentToGeneralNoticeList(
        notice,
        getAllNoticeQueryDto.lang,
        userUuid,
      ),
    );
    return {
      totol: await this.noticeRepository.getTotalCount(
        getAllNoticeQueryDto,
        userUuid,
      ),
      list: await Promise.all(notices),
    };
  }

  async getNotice(
    id: number,
    getNoticeDto: GetNoticeDto,
    userUuid?: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    let notice: NoticeFullContent;
    if (getNoticeDto.isViewed) {
      notice = await this.noticeRepository.getNoticeWithView(id);
    } else {
      notice = await this.noticeRepository.getNotice(id);
    }
    return this.noticeMapper.NoticeFullContentToExpandedGeneralNoticeList(
      notice,
      getNoticeDto.lang,
      userUuid,
    );
  }

  async createNotice(
    createNoticeDto: CreateNoticeDto,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    if (createNoticeDto.images.length) {
      await this.imageService.validateImages(createNoticeDto.images);
    }
    if (createNoticeDto.documents.length) {
      await this.documentService.validateDocuments(createNoticeDto.documents);
    }

    const notice = await this.noticeRepository.createNotice(
      createNoticeDto,
      userUuid,
    );

    return this.getNotice(notice.id, { isViewed: false });
  }
}
