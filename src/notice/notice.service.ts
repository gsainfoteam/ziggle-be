import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { AdditionalNoticeDto } from './dto/req/additionalNotice.dto';
import { ForeignContentDto } from './dto/req/foreignContent.dto';
import { ReactionDto } from './dto/req/reaction.dto';
import { UpdateNoticeDto } from './dto/req/updateNotice.dto';
import { FileService } from 'src/file/file.service';

@Injectable()
export class NoticeService {
  private readonly loggger = new Logger(NoticeService.name);
  constructor(
    private readonly imageService: ImageService,
    private readonly documentService: DocumentService,
    private readonly fileService: FileService,
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

  async addNoticeAdditional(
    additionalNoticeDto: AdditionalNoticeDto,
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository
      .addAdditionalNotice(additionalNoticeDto, id, userUuid)
      .catch((error) => {
        if (error instanceof NotFoundException) {
          throw new ForbiddenException();
        }
        throw error;
      });

    return this.getNotice(id, { isViewed: false });
  }

  async addForeignContent(
    foreignContentDto: ForeignContentDto,
    id: number,
    idx: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository
      .addForeignContent(foreignContentDto, id, idx, userUuid)
      .catch((error) => {
        if (error instanceof NotFoundException) {
          throw new ForbiddenException();
        }
        throw error;
      });
    return this.getNotice(id, { isViewed: false });
  }

  async addNoticeReminder(
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository.addReminder(id, userUuid);

    return this.getNotice(id, { isViewed: false });
  }

  async addNoticeReaction(
    { emoji }: ReactionDto,
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository.addReaction(emoji, id, userUuid);

    return this.getNotice(id, { isViewed: false });
  }

  async updateNotice(
    body: UpdateNoticeDto,
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    const noitce = await this.noticeRepository.getNotice(id);
    if (noitce.author.uuid !== userUuid) {
      throw new ForbiddenException();
    }
    if (noitce.createdAt.getTime() + 1000 * 60 * 30 < new Date().getTime()) {
      throw new ForbiddenException();
    }
    await this.noticeRepository.updateNotice(body, id, userUuid);

    return this.getNotice(id, { isViewed: false });
  }

  async removeNoticeReminder(
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository.removeReminder(id, userUuid);

    return this.getNotice(id, { isViewed: false });
  }

  async removeNoticeReaction(
    { emoji }: ReactionDto,
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository.removeReaction(emoji, id, userUuid);

    return this.getNotice(id, { isViewed: false });
  }

  async deleteNotice(id: number, userUuid: string): Promise<void> {
    const notice = await this.noticeRepository.getNotice(id);
    if (notice.author.uuid !== userUuid) {
      throw new ForbiddenException();
    }
    await this.fileService.deleteFiles(notice.files.map(({ url }) => url));
    await this.noticeRepository.deleteNotice(id, userUuid);
  }
}
