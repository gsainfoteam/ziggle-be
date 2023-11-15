import { Injectable } from '@nestjs/common';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { GetAllNoticeQueryDto } from './dto/getAllNotice.dto';
import { ImageService } from 'src/image/image.service';
import { FcmService } from 'src/global/service/fcm.service';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { htmlToText } from 'html-to-text';
import dayjs from 'dayjs';
import { AdditionalNoticeDto } from './dto/additionalNotice.dto';
import { ForeignContentDto } from './dto/foreignContent.dto';
import { NoticeRepository } from './notice.repository';

@Injectable()
export class NoticeService {
  private readonly s3Url: string;
  constructor(
    private readonly noticeRepository: NoticeRepository,
    private readonly imageService: ImageService,
    private readonly fcmService: FcmService,
    configService: ConfigService,
  ) {
    this.s3Url = `https://s3.${configService.get<string>(
      'AWS_S3_REGION',
    )}.amazonaws.com/${configService.get<string>('AWS_S3_BUCKET_NAME')}/`;
  }

  async getNoticeList(
    getAllNoticeQueryDto: GetAllNoticeQueryDto,
    userUuid?: string,
  ) {
    const notices = await this.noticeRepository.getNoticeList(
      getAllNoticeQueryDto,
      userUuid,
    );
    return {
      list: notices.map(({ files, author, ...notice }) => {
        delete notice.authorId;
        return {
          ...notice,
          author: author.name,
          imageUrl: files?.[0]?.url ? `${this.s3Url}${files[0].url}` : null,
          title: notice.contents[0].title,
          body: htmlToText(notice.contents[0].body),
        };
      }),
    };
  }

  async getNotice(id: number, userUuid?: string) {
    const notice = await this.noticeRepository.getNotice(id);
    const { reminders, ...noticeInfo } = notice;
    return {
      ...noticeInfo,
      author: notice.author.name,
      imagesUrls: notice.files?.map((file) => `${this.s3Url}${file.url}`),
      reminder: reminders.some((reminder) => reminder.uuid === userUuid),
    };
  }

  async createNotice(
    { title, body, deadline, tags, images }: CreateNoticeDto,
    userUuid: string,
  ) {
    if (images) {
      await this.imageService.validateImages(images);
    }

    const notice = await this.noticeRepository.createNotice(
      {
        title,
        body,
        deadline,
        tags,
        images,
      },
      userUuid,
    );

    this.fcmService.postMessage(
      {
        title: '새 공지글',
        body: title,
        imageUrl: images.length === 0 ? undefined : `${this.s3Url}${images[0]}`,
      },
      (await this.noticeRepository.getAllFcmTokens()).map(({ token }) => token),
      { path: `/root/article?id=${notice.id}` },
    );
    return this.getNotice(notice.id);
  }

  async addNoticeAdditional(
    { title, body, deadline }: AdditionalNoticeDto,
    id: number,
    userUuid: string,
  ) {
    await this.noticeRepository.addAdditionalNotice(
      {
        title,
        body,
        deadline,
      },
      id,
      userUuid,
    );

    return this.getNotice(id);
  }

  async addForeignContent(
    { lang, title, body, deadline }: ForeignContentDto,
    id: number,
    idx: number,
    userUuid: string,
  ) {
    await this.noticeRepository.addForeignContent(
      { lang, title, body, deadline },
      id,
      idx,
      userUuid,
    );
    return this.getNotice(id);
  }

  async modifyNoticeReminder(id: number, userUuid: string, remind: boolean) {
    if (remind) {
      await this.noticeRepository.addReminder(id, userUuid);
    } else {
      await this.noticeRepository.removeReminder(id, userUuid);
    }
    return this.getNotice(id, userUuid);
  }

  async deleteNotice(id: number, userUuid: string): Promise<void> {
    const notice = await this.noticeRepository.getNotice(id);
    this.imageService.deleteImages(notice.files.map(({ url }) => url));
    await this.noticeRepository.deleteNotice(id, userUuid);
  }

  @Cron('0 9 * * *')
  async sendReminderMessage() {
    const targetNotices = await this.noticeRepository.getNoticeByTime(
      new Date(),
    );
    targetNotices.map((notice) => {
      const leftDate = dayjs(notice.currentDeadline)
        .startOf('d')
        .diff(dayjs().startOf('d'), 'd');
      return this.fcmService.postMessage(
        {
          title: `[Reminder] ${leftDate}일 남은 공지가 있어요!`,
          body: `${notice.contents[0].title} 마감이 ${leftDate}일 남았어요`,
          imageUrl: notice.files?.[0].url
            ? `${this.s3Url}${notice.files[0].url}`
            : undefined,
        },
        notice.reminders
          .flatMap(({ fcmTokens }) => fcmTokens)
          .map(({ token }) => token),
        { path: `/root/article?id=${notice.id}` },
      );
    });
  }
}
