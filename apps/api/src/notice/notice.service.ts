import {
  BadRequestException,
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
import { AdditionalNoticeDto } from './dto/req/additionalNotice.dto';
import { ForeignContentDto } from './dto/req/foreignContent.dto';
import { ReactionDto } from './dto/req/reaction.dto';
import {
  UpdateNoticeDto,
  UpdateNoticeQueryDto,
} from './dto/req/updateNotice.dto';
import { htmlToText } from 'html-to-text';
import { Notification } from 'firebase-admin/messaging';
import { Authority } from '../group/types/groupInfo.type';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { ImageService } from '../image/image.service';
import { DocumentService } from '../document/document.service';
import { FileService } from '../file/file.service';
import { GroupService } from '../group/group.service';
import { FcmService } from '../fcm/fcm.service';
import { FcmTargetUser } from '../fcm/types/fcmTargetUser.type';

@Injectable()
@Loggable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);
  private fcmDelay: number;
  constructor(
    private readonly imageService: ImageService,
    private readonly documentService: DocumentService,
    private readonly fileService: FileService,
    private readonly noticeRepository: NoticeRepository,
    private readonly noticeMapper: NoticeMapper,
    private readonly groupService: GroupService,
    private readonly fcmService: FcmService,
    private readonly customConfigService: CustomConfigService,
  ) {
    this.fcmDelay = Number(this.customConfigService.FCM_DELAY);
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
          this.logger.debug(`Notice ${notice.id} is not valid`);
          this.logger.error(error);
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
        this.logger.debug(`Notice ${notice.id} is not valid`);
        this.logger.error(error);
        throw new InternalServerErrorException(
          `Notice ${notice.id} is not valid`,
        );
      });
  }

  async createNotice(
    createNoticeDto: CreateNoticeDto,
    userUuid: string,
    groupsToken?: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    let groupName;

    if (createNoticeDto.groupId !== undefined && groupsToken !== undefined) {
      const getGroupResult =
        await this.groupService.getGroupInfoFromGroups(groupsToken);

      const matchingGroup = getGroupResult.find(
        (group) =>
          group.uuid === createNoticeDto.groupId &&
          group.role.some((role) =>
            role.externalAuthority.includes(Authority.WRITE),
          ),
      );

      if (!matchingGroup) {
        throw new ForbiddenException();
      }

      groupName = matchingGroup.name;
    }

    if (createNoticeDto.images.length) {
      await this.imageService.validateImages(createNoticeDto.images);
    }
    if (createNoticeDto.documents.length) {
      await this.documentService.validateDocuments(createNoticeDto.documents);
    }
    const createdNotice = await this.noticeRepository.createNotice(
      createNoticeDto,
      {
        userUuid,
        publishedAt: new Date(new Date().getTime() + this.fcmDelay),
        createdAt: undefined,
        groupName,
      },
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

  async sendNotice(
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    const notice = await this.getNotice(id, { isViewed: false });
    if (notice.author.uuid !== userUuid) {
      throw new ForbiddenException('not author of the notice');
    }
    if (notice.publishedAt < new Date()) {
      throw new ForbiddenException('a message already sent');
    }

    const notification = {
      title: '[긴급] ' + notice.title,
      body: notice.content,
      imageUrl: notice.imageUrls ? notice.imageUrls[0] : undefined,
    };

    await this.noticeRepository
      .updatePublishedAt(id, new Date())
      .catch((error) => {
        this.logger.error(
          `Failed to update publishedAt for notice ${id}: `,
          error,
        );
        throw new InternalServerErrorException('failed to update publishedAt');
      });

    await this.fcmService.deleteMessageJobIdPattern(notice.id.toString());
    await this.fcmService
      .postMessageImmediately(
        notice.id.toString(),
        this.convertNotificationBodyToString(notification),
        FcmTargetUser.All,
        {
          path: `/notice/${id}`,
        },
      )
      .catch((error) => {
        this.logger.error(
          `Failed to send notification for notice ${id}: `,
          error,
        );
        throw new InternalServerErrorException('failed to send notification');
      });

    return notice;
  }

  async addNoticeAdditional(
    additionalNoticeDto: AdditionalNoticeDto,
    id: number,
    userUuid: string,
  ): Promise<ExpandedGeneralNoticeDto> {
    const notice = await this.noticeRepository.getNotice(id);
    if ((notice.currentDeadline === null) === !!additionalNoticeDto.deadline) {
      throw new BadRequestException("Can't add or remove deadline");
    }

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
    const notice = await this.noticeRepository.getNotice(id);
    if (notice.author.uuid !== userUuid) {
      throw new ForbiddenException();
    }
    if (notice.createdAt.getTime() + 1000 * 60 * 30 < new Date().getTime()) {
      throw new ForbiddenException();
    }
    await this.noticeRepository.updateNotice(body, query, id, userUuid);

    return this.getNotice(id, { isViewed: false });
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
    await this.fcmService.deleteMessageJobIdPattern(id.toString());
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
