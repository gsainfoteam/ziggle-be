import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
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
import {
  UpdateNoticeDto,
  UpdateNoticeQueryDto,
} from './dto/req/updateNotice.dto';
import { FileService } from 'src/file/file.service';
import { GroupService } from 'src/group/group.service';
import { FcmService } from 'src/fcm/fcm.service';
import { FcmTargetUser } from 'src/fcm/types/fcmTargetUser.type';
import { htmlToText } from 'html-to-text';
import { Notification } from 'firebase-admin/messaging';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NoticeService {
  private readonly loggger = new Logger(NoticeService.name);
  private fcmDelay: number;
  constructor(
    private readonly imageService: ImageService,
    private readonly documentService: DocumentService,
    private readonly fileService: FileService,
    private readonly noticeRepository: NoticeRepository,
    private readonly noticeMapper: NoticeMapper,
    private readonly groupService: GroupService,
    private readonly fcmService: FcmService,
    private readonly configService: ConfigService,
  ) {
    this.fcmDelay = Number(this.configService.getOrThrow<number>('FCM_DELAY'));
  }

  async getNoticeList(
    getAllNoticeQueryDto: GetAllNoticeQueryDto,
    userUuid?: string,
  ): Promise<GeneralNoticeListDto> {
    const notices = (
      await this.noticeRepository.getNoticeList(getAllNoticeQueryDto, userUuid)
    ).map((notice) =>
      this.noticeMapper
        .NoticeFullContentToGeneralNoticeList(
          notice,
          getAllNoticeQueryDto.lang,
          userUuid,
        )
        .catch((error) => {
          this.loggger.debug(`Notice ${notice.id} is not valid`);
          this.loggger.error(error);
          throw new InternalServerErrorException(
            `Notice ${notice.id} is not valid`,
          );
        }),
    );
    return {
      total: await this.noticeRepository.getTotalCount(
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
      if (userUuid !== undefined)
        await this.noticeRepository.updateUserRecord(id, userUuid);
    } else {
      notice = await this.noticeRepository.getNotice(id);
    }
    return this.noticeMapper
      .NoticeFullContentToExpandedGeneralNoticeList(
        notice,
        getNoticeDto.lang,
        userUuid,
      )
      .catch((error) => {
        this.loggger.debug(`Notice ${notice.id} is not valid`);
        this.loggger.error(error);
        throw new InternalServerErrorException(
          `Notice ${notice.id} is not valid`,
        );
      });
  }

  async createNotice(
    createNoticeDto: CreateNoticeDto,
    userUuid: string,
    token: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    if (createNoticeDto.groupName !== undefined) {
      const getGroupResult = await this.groupService.getGroupFromVapor(
        createNoticeDto.groupName,
        token,
      );

      if (!getGroupResult) {
        throw new ForbiddenException();
      }
    }

    if (createNoticeDto.images.length) {
      await this.imageService.validateImages(createNoticeDto.images);
    }
    if (createNoticeDto.documents.length) {
      await this.documentService.validateDocuments(createNoticeDto.documents);
    }

    const createdNotice = await this.noticeRepository.createNotice(
      createNoticeDto,
      userUuid,
      undefined,
      new Date(new Date().getTime() + this.fcmDelay),
    );

    const notice = await this.getNotice(createdNotice.id, { isViewed: false });

    const notification = {
      title: notice.title,
      body: notice.content,
      imageUrl: notice.imageUrls ? notice.imageUrls[0] : undefined,
    };

    await this.fcmService.postMessageWithDelay(
      notice.id.toString(),
      this.convertNotificationBodyToString(notification),
      FcmTargetUser.All,
      {
        path: `/notice/${createdNotice.id}`,
      },
    );

    return notice;
  }

  async sendNotice(id: number, userUuid: string): Promise<void> {
    this.loggger.log(`Send notice ${id}`);
    const notice = await this.getNotice(id, { isViewed: false });
    if (notice.author.uuid !== userUuid) {
      throw new ForbiddenException('not author of the notice');
    }
    if (notice.publishedAt === null || notice.publishedAt < new Date()) {
      throw new ForbiddenException('a message already sent');
    }
    this.loggger.log(`Notice time ${notice.publishedAt} is not sent yet`);

    const notification = {
      title: notice.title,
      body: notice.content,
      imageUrl: notice.imageUrls ? notice.imageUrls[0] : undefined,
    };

    await this.fcmService.deleteMessageJobIdPattern(String(notice.id));
    await this.fcmService.postMessage(
      this.convertNotificationBodyToString(notification),
      FcmTargetUser.All,
      {
        path: `/notice/${id}`,
      },
    );
    await this.noticeRepository.updatePublishedAt(id, new Date());
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

    return this.getNotice(id, { isViewed: false }, userUuid);
  }

  async addNoticeReaction(
    { emoji }: ReactionDto,
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository.addReaction(emoji, id, userUuid);

    return this.getNotice(id, { isViewed: false }, userUuid);
  }

  async updateNotice(
    body: UpdateNoticeDto,
    query: UpdateNoticeQueryDto,
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
    await this.noticeRepository.updateNotice(body, query, id, userUuid);

    return this.getNotice(id, { isViewed: false });
  }

  async removeNoticeReminder(
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository.removeReminder(id, userUuid);

    return this.getNotice(id, { isViewed: false }, userUuid);
  }

  async removeNoticeReaction(
    { emoji }: ReactionDto,
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    await this.noticeRepository.removeReaction(emoji, id, userUuid);

    return this.getNotice(id, { isViewed: false }, userUuid);
  }

  async deleteNotice(id: number, userUuid: string): Promise<void> {
    await this.fcmService.deleteMessageJobIdPattern(String(id));
    const notice = await this.noticeRepository.getNotice(id);
    if (notice.author.uuid !== userUuid) {
      throw new ForbiddenException();
    }
    await this.fileService.deleteFiles(notice.files.map(({ url }) => url));
    await this.noticeRepository.deleteNotice(id, userUuid);
  }

  convertNotificationBodyToString(notification: Notification) {
    return {
      ...notification,
      body: notification.body
        ? htmlToText(notification.body, {
            selectors: [
              { selector: 'a', options: { ignoreHref: true } },
              { selector: 'img', format: 'skip' },
            ],
          })
            .slice(0, 1000)
            .replaceAll(/\s+/gm, ' ')
        : undefined,
    };
  }
}
