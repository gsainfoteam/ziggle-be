import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FcmToken, FileType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdditionalNoticeDto } from './dto/additionalNotice.dto';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { ForeignContentDto } from './dto/foreignContent.dto';
import { GetAllNoticeQueryDto } from './dto/getAllNotice.dto';
import { NoticeFullcontent } from './types/noticeFullcontent';
import { NoticeReminder } from './types/noticeReminer';
import { UpdateNoticeDto } from './dto/updateNotice.dto';

@Injectable()
export class NoticeRepository {
  private readonly logger = new Logger(NoticeRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async getTotalCount(
    { lang, search, tags, orderBy, my }: GetAllNoticeQueryDto,
    userUuid?: string,
  ): Promise<number> {
    return this.prismaService.notice.count({
      where: {
        deletedAt: null,
        authorId: my === 'own' ? userUuid : undefined,
        reminders:
          my === 'reminders' ? { some: { uuid: userUuid } } : undefined,
        tags: tags && { some: { name: { in: tags } } },
        ...(orderBy === 'deadline'
          ? { currentDeadline: { gte: dayjs().startOf('d').toDate() } }
          : orderBy === 'hot'
          ? {
              createdAt: {
                gte: dayjs().startOf('d').subtract(7, 'd').toDate(),
              },
            }
          : {}),
        OR: [
          {
            contents: {
              some: {
                AND: {
                  lang: lang ?? 'ko',
                  OR: [
                    { title: { contains: search } },
                    { body: { contains: search } },
                  ],
                },
              },
            },
          },
          { tags: { some: { name: { contains: search } } } },
        ],
      },
    });
  }

  async getNoticeList(
    {
      offset = 0,
      limit = 10,
      lang,
      search,
      tags,
      orderBy,
      my,
    }: GetAllNoticeQueryDto,
    userUuid?: string,
  ): Promise<Omit<NoticeFullcontent, 'reminders'>[]> {
    return this.prismaService.notice
      .findMany({
        take: limit,
        skip: offset,
        orderBy: {
          currentDeadline: orderBy === 'deadline' ? 'asc' : undefined,
          views: orderBy === 'hot' ? 'desc' : undefined,
          createdAt: orderBy === 'recent' ? 'desc' : undefined,
        },
        where: {
          ...(orderBy === 'deadline'
            ? { currentDeadline: { gte: dayjs().startOf('d').toDate() } }
            : orderBy === 'hot'
            ? {
                createdAt: {
                  gte: dayjs().startOf('d').subtract(7, 'd').toDate(),
                },
              }
            : {}),
          deletedAt: null,
          authorId: my === 'own' ? userUuid : undefined,
          reminders:
            my === 'reminders' ? { some: { uuid: userUuid } } : undefined,
          tags: tags && { some: { name: { in: tags } } },
          OR: [
            {
              contents: {
                some: {
                  AND: {
                    lang: lang ?? 'ko',
                    OR: [
                      { title: { contains: search } },
                      { body: { contains: search } },
                    ],
                  },
                },
              },
            },
            { tags: { some: { name: { contains: search } } } },
          ],
        },
        include: {
          tags: true,
          contents: { where: { id: 1 } },
          author: { select: { name: true, uuid: true } },
          files: {
            where: { type: FileType.IMAGE },
            orderBy: { order: 'asc' },
            take: 1,
          },
          reactions: {
            where: {
              deletedAt: null,
            },
          },
        },
      })
      .catch((err) => {
        this.logger.error('getNoticeList error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async getNotice(id: number): Promise<NoticeFullcontent> {
    return this.prismaService.notice
      .findUniqueOrThrow({
        where: { id, deletedAt: null },
        include: {
          tags: true,
          contents: {
            orderBy: {
              id: 'asc',
            },
          },
          reminders: true,
          author: {
            select: {
              name: true,
              uuid: true,
            },
          },
          files: { orderBy: { order: 'asc' } },
          reactions: {
            where: {
              deletedAt: null,
            },
          },
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
        this.logger.error('getNotice');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async getNoticeWithView(id: number): Promise<NoticeFullcontent> {
    return this.prismaService.notice
      .update({
        where: { id, deletedAt: null },
        data: {
          views: {
            increment: 1,
          },
        },
        include: {
          tags: true,
          contents: {
            orderBy: {
              id: 'asc',
            },
          },
          reminders: true,
          author: {
            select: {
              name: true,
              uuid: true,
            },
          },
          files: { orderBy: { order: 'asc' } },
          reactions: {
            where: {
              deletedAt: null,
            },
          },
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
        this.logger.error('getNotice');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async getNoticeByTime(time: Date): Promise<NoticeReminder[]> {
    return this.prismaService.notice
      .findMany({
        where: {
          deletedAt: null,
          currentDeadline: {
            gte: dayjs(time).startOf('d').add(1, 'd').toDate(),
            lte: dayjs(time).startOf('d').add(2, 'd').toDate(),
          },
        },
        include: {
          reminders: {
            include: {
              fcmTokens: true,
            },
          },
          contents: true,
          files: { orderBy: { order: 'asc' } },
        },
      })
      .catch((err) => {
        this.logger.error('getNoticeByTime');
        this.logger.debug(err);
        return [];
      });
  }

  async createNotice(
    { title, body, deadline, tags, images, documents }: CreateNoticeDto,
    userUuid: string,
    createdAt?: Date,
  ) {
    const findedTags = await this.prismaService.tag.findMany({
      where: {
        id: {
          in: tags,
        },
      },
    });
    return this.prismaService.notice
      .create({
        data: {
          author: {
            connect: {
              uuid: userUuid,
            },
          },
          contents: {
            create: {
              id: 1,
              lang: 'ko',
              title,
              body,
              deadline: deadline || null,
            },
          },
          currentDeadline: deadline || null,
          tags: {
            connect: findedTags,
          },
          files: {
            create: [
              ...images?.map((image, idx) => ({
                order: idx,
                name: title,
                type: FileType.IMAGE,
                url: image,
              })),
              ...documents?.map((document, idx) => ({
                order: idx,
                name: title,
                type: FileType.DOCUMENT,
                url: document,
              })),
            ],
          },
          createdAt,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(
              `User with UUID "${userUuid}" not found`,
            );
          }
        }
        this.logger.error('createNotice error');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async addAdditionalNotice(
    { title, body, deadline }: AdditionalNoticeDto,
    id: number,
    userUuid: string,
  ): Promise<void> {
    const notice = await this.prismaService.notice
      .findUniqueOrThrow({
        where: { id, deletedAt: null },
        include: {
          contents: {
            where: {
              lang: 'ko',
            },
            orderBy: {
              id: 'desc',
            },
          },
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
        this.logger.error('addAdditionalNotice - find');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
    if (notice.authorId !== userUuid) {
      throw new ForbiddenException();
    }
    await this.prismaService.notice
      .update({
        where: { id, deletedAt: null },
        data: {
          contents: {
            create: {
              id: Math.max(...notice.contents.map((c) => c.id)) + 1,
              lang: 'ko',
              title: title ?? notice.contents[0].title,
              body,
              deadline,
            },
          },
          currentDeadline: deadline ?? notice.currentDeadline,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
        this.logger.error('addAdditionalNotice - craete');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async addForeignContent(
    { lang, title, body, deadline }: ForeignContentDto,
    id: number,
    idx: number,
    userUuid: string,
  ): Promise<void> {
    await this.prismaService.notice
      .update({
        where: { id, authorId: userUuid, deletedAt: null },
        data: {
          contents: {
            create: {
              id: idx,
              lang,
              title,
              body,
              deadline,
            },
          },
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new ForbiddenException();
          }
        }
        this.logger.error('addForeignContent');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async addReminder(id: number, userUuid: string): Promise<void> {
    await this.prismaService.notice
      .update({
        where: { id, deletedAt: null },
        data: {
          reminders: {
            connect: {
              uuid: userUuid,
            },
          },
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
        this.logger.error('addReminder');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async removeReminder(id: number, userUuid: string): Promise<void> {
    await this.prismaService.notice
      .update({
        where: { id, deletedAt: null },
        data: {
          reminders: {
            disconnect: {
              uuid: userUuid,
            },
          },
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
        this.logger.error('removeReminder');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async addReaction(
    id: number,
    emoji: string,
    userUuid: string,
  ): Promise<void> {
    await this.prismaService.notice
      .update({
        where: { id, deletedAt: null },
        data: {
          reactions: {
            connect: {
              emoji_noticeId_userId: {
                emoji,
                noticeId: id,
                userId: userUuid,
              },
            },
          },
        },
      })
      .catch((err) => {
        this.logger.error('addReaction');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async removeReaction(
    id: number,
    emoji: string,
    userUuid: string,
  ): Promise<void> {
    await this.prismaService.reaction.update({
      where: {
        emoji_noticeId_userId: {
          emoji,
          noticeId: id,
          userId: userUuid,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async deleteNotice(id: number, userUuid: string): Promise<void> {
    await this.prismaService.notice
      .update({
        where: { id, authorId: userUuid, deletedAt: null },
        data: { deletedAt: new Date() },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new ForbiddenException();
          }
        }
        this.logger.error('deleteNotice');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async updateNotice(
    id: number,
    { body, deadline }: UpdateNoticeDto,
    userUuid: string,
  ): Promise<void> {
    await this.prismaService.notice
      .update({
        where: { id, authorId: userUuid, deletedAt: null },
        data: {
          contents: {
            update: {
              where: {
                id_lang_noticeId: {
                  id: 1,
                  lang: 'ko',
                  noticeId: id,
                },
              },
              data: {
                body,
                deadline,
              },
            },
          },
          currentDeadline: deadline,
        },
      })
      .catch((err) => {
        this.logger.error('updateNotice');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }

  async getFcmTokensByNoticeId(id: number): Promise<FcmToken[]> {
    return this.prismaService.fcmToken.findMany({
      where: {
        user: {
          remindedNotices: {
            some: {
              id,
            },
          },
        },
      },
    });
  }

  async getAllFcmTokens(): Promise<FcmToken[]> {
    return this.prismaService.fcmToken.findMany().catch((err) => {
      this.logger.error('getAllFcmTokens');
      this.logger.debug(err);
      throw new InternalServerErrorException('Database error');
    });
  }
}
