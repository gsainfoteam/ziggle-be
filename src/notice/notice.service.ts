import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { GetAllNoticeQueryDto } from './dto/getAllNotice.dto';
import { ImageService } from 'src/image/image.service';
import { FcmService } from 'src/global/service/fcm.service';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { htmlToText } from 'html-to-text';
import dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class NoticeService {
  s3Url: string;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly imageService: ImageService,
    private readonly fcmService: FcmService,
    configService: ConfigService,
  ) {
    this.s3Url = `https://s3.${configService.get<string>(
      'AWS_S3_REGION',
    )}.amazonaws.com/${configService.get<string>('AWS_S3_BUCKET_NAME')}/`;
    // this.sendReminderMessage();
  }

  async getNoticeList(
    getAllNoticeQueryDto: GetAllNoticeQueryDto,
    userUuid?: string,
  ) {
    const result = await this.noticeRepository.getNoticeList(
      getAllNoticeQueryDto,
      userUuid,
    );
    return {
      ...result,
      list: result.list.map(({ imagesUrl, ...notice }) => ({
        ...notice,
        author: notice.author.name,
        imageUrl: imagesUrl?.[0] ? `${this.s3Url}${imagesUrl[0]}` : null,
        body: htmlToText(notice.body).slice(0, 100),
      })),
    };
  }

  async getNotice(id: number, user?: User) {
    const notice = await this.prismaService.notice
      .update({
        where: { id },
        include: {
          contents: true,
          reminders: true,
          author: true,
        },
        data: { views: { increment: 1 } },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
        throw new InternalServerErrorException();
      });
    const { reminders, ...noticeInfo } = notice;
    return {
      ...noticeInfo,
      author: notice.author.name,
      imagesUrl: notice.imagesUrl?.map((url) => `${this.s3Url}${url}`),
      reminder: reminders.some((reminder) => reminder.uuid === user?.uuid),
    };
  }

  async createNotice(
    { title, body, deadline, tags, images }: CreateNoticeDto,
    userUUID: string,
  ) {
    const user = await this.userRepository.findByUserUUID(userUUID);
    let findTags = null;
    if (tags) {
      findTags = await this.tagRepository.findTagList(tags);
    }
    if (!user)
      throw new NotFoundException(`User with UUID "${userUUID}" not found`);
    if (images) {
      await this.imageService.validateImages(images);
    }

    const notice = await this.noticeRepository.createNotice(
      user,
      title,
      body,
      deadline,
      findTags,
      images,
    );
    if (!notice) throw new InternalServerErrorException(`Notice not created`);

    const tokens = await this.userRepository.getAllFcmTokens();
    this.fcmService.postMessage(
      {
        title: '새 공지글',
        body: title,
        imageUrl: images.length === 0 ? undefined : `${this.s3Url}${images[0]}`,
      },
      tokens,
      { path: `/root/article?id=${notice.id}` },
    );
    return this.getNotice(notice.id);
  }

  async addNoticeReminder(id: number, user: User) {
    const notice = await this.noticeRepository.addNoticeReminder(id, user);
    return notice;
  }

  async removeNoticeReminder(id: number, user: User) {
    const notice = await this.noticeRepository.removeNoticeReminder(id, user);
    return notice;
  }

  async deleteNotice(id: number, userUUID: string): Promise<void> {
    const result = await this.noticeRepository.deleteNotice(userUUID, id);
    if (!result) {
      throw new NotFoundException(`Notice with ID "${id}" not found`);
    }
    this.imageService.deleteImages(result.imagesUrl);
  }

  @Cron('0 9 * * *')
  async sendReminderMessage() {
    const targetNotices = await this.noticeRepository.getReminderTargetList();
    targetNotices.map((notice) => {
      const leftDate = dayjs(notice.deadline)
        .startOf('d')
        .diff(dayjs().startOf('d'), 'd');
      return this.fcmService.postMessage(
        {
          title: `[Reminder] ${leftDate}일 남은 공지가 있어요!`,
          body: `${notice.title} 마감이 ${leftDate}일 남았어요`,
          imageUrl: notice.imagesUrl?.[0]
            ? `${this.s3Url}${notice.imagesUrl[0]}`
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
