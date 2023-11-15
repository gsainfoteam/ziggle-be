import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FcmToken, FileType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetAllNoticeQueryDto } from './dto/getAllNotice.dto';
import { NoticeFullcontent } from './types/noticeFullcontent';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { AdditionalNoticeDto } from './dto/additionalNotice.dto';
import { ForeignContentDto } from './dto/foreignContent.dto';
import dayjs from 'dayjs';
import { NoticeReminder } from './types/noticeReminer';

@Injectable()
export class NoticeRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getNoticeList(
    { offset, limit, lang, search, tags, orderBy, my }: GetAllNoticeQueryDto,
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
          deletedAt: null,
          authorId: my === 'own' ? userUuid : undefined,
          reminders:
            my === 'reminders'
              ? {
                  some: {
                    uuid: userUuid,
                  },
                }
              : undefined,
          tags: tags && {
            some: { name: { in: tags } },
          },
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
            {
              tags: {
                some: {
                  name: { contains: search },
                },
              },
            },
          ],
        },
        include: {
          tags: true,
          contents: {
            orderBy: {
              id: 'asc',
            },
            take: 1,
          },
          author: {
            select: {
              name: true,
            },
          },
          files: {
            where: {
              type: FileType.IMAGE,
            },
          },
        },
      })
      .catch(() => {
        throw new InternalServerErrorException('Database error');
      });
  }

  async getNotice(id: number): Promise<NoticeFullcontent> {
    return this.prismaService.notice
      .update({
        where: {
          id,
        },
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
            },
          },
          files: true,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
        throw new InternalServerErrorException('Database error');
      });
  }

  async getNoticeByTime(time: Date): Promise<NoticeReminder[]> {
    return this.prismaService.notice.findMany({
      where: {
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
        files: true,
      },
    });
  }

  async createNotice(
    { title, body, deadline, tags, images }: CreateNoticeDto,
    userUuid: string,
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
            create: images?.map((image) => ({
              name: title,
              type: FileType.IMAGE,
              url: image,
            })),
          },
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
        where: {
          id,
        },
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
        throw new InternalServerErrorException('Database error');
      });
    if (notice.authorId !== userUuid) {
      throw new ForbiddenException();
    }
    await this.prismaService.notice
      .update({
        where: {
          id,
        },
        data: {
          contents: {
            create: {
              id: notice.contents[0].id,
              lang: 'ko',
              title: title ?? '',
              body,
              deadline,
            },
          },
          currentDeadline: deadline ?? undefined,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`Notice with ID "${id}" not found`);
          }
        }
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
        where: {
          id,
          authorId: userUuid,
        },
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
        throw new InternalServerErrorException('Database error');
      });
  }

  async addReminder(id: number, userUuid: string): Promise<void> {
    await this.prismaService.notice
      .update({
        where: {
          id,
        },
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
        throw new InternalServerErrorException('Database error');
      });
  }

  async removeReminder(id: number, userUuid: string): Promise<void> {
    await this.prismaService.notice
      .update({
        where: {
          id,
        },
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
      });
  }

  async deleteNotice(id: number, userUuid: string): Promise<void> {
    await this.prismaService.notice
      .delete({
        where: {
          id,
          authorId: userUuid,
        },
      })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new ForbiddenException();
          }
        }
        throw new InternalServerErrorException('Database error');
      });
  }

  async getAllFcmTokens(): Promise<FcmToken[]> {
    return this.prismaService.fcmToken.findMany().catch(() => {
      throw new InternalServerErrorException('Database error');
    });
  }
}
