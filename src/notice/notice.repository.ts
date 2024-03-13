import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetAllNoticeQueryDto } from './dto/req/getAllNotice.dto';
import dayjs from 'dayjs';
import { NoticeFullContent } from './types/noticeFullContent';
import { FileType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateNoticeDto } from './dto/req/createNotice.dto';

@Injectable()
export class NoticeRepository {
  private readonly logger = new Logger(NoticeRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * this method is used to get the total count of the notices
   * @param param0 the query dto
   * @param userUuid the user's uuid
   * @returns the total count of the notices
   */
  async getTotalCount(
    { search, tags, orderBy, my }: GetAllNoticeQueryDto,
    userUuid?: string,
  ): Promise<number> {
    this.logger.log(`getTotalCount`);
    return await this.prismaService.notice.count({
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
        ...(search
          ? {
              OR: [
                {
                  contents: {
                    some: {
                      OR: [
                        { title: { contains: search } },
                        { body: { contains: search } },
                      ],
                    },
                  },
                },
                { tags: { some: { name: { contains: search } } } },
              ],
            }
          : {}),
      },
    });
  }

  /**
   * this method is used to get the list of notices
   * @param param0 the query dto
   * @param userUuid user's uuid
   * @returns the list of notices
   */
  async getNoticeList(
    { offset = 0, limit = 10, search, tags, orderBy, my }: GetAllNoticeQueryDto,
    userUuid?: string,
  ): Promise<NoticeFullContent[]> {
    this.logger.log(`getNoticeList`);
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
          ...(search
            ? {
                OR: [
                  {
                    contents: {
                      some: {
                        OR: [
                          { title: { contains: search } },
                          { body: { contains: search } },
                        ],
                      },
                    },
                  },
                  { tags: { some: { name: { contains: search } } } },
                ],
              }
            : {}),
        },
        include: {
          tags: true,
          contents: {
            where: {
              id: 1,
            },
          },
          cralws: true,
          reminders: true,
          author: {
            select: {
              name: true,
              uuid: true,
            },
          },
          files: {
            where: {
              type: FileType.IMAGE,
            },
            orderBy: { order: 'asc' },
          },
          reactions: {
            where: {
              deletedAt: null,
            },
          },
        },
      })
      .catch((error) => {
        this.logger.error('getNoticeList error');
        this.logger.debug(error);
        throw new InternalServerErrorException();
      });
  }

  /**
   * this method is used to get the notice
   * @param id the notice id
   * @returns the notice
   */
  async getNotice(id: number): Promise<NoticeFullContent> {
    this.logger.log(`getNotice`);
    return this.prismaService.notice
      .findUniqueOrThrow({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          tags: true,
          contents: {
            orderBy: {
              id: 'asc',
            },
          },
          cralws: true,
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
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            this.logger.debug(`Notice with id ${id} not found`);
            throw new NotFoundException(`Notice with id ${id} not found`);
          }
          this.logger.error('getNotice error');
          this.logger.debug(error);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('getNotice error');
        this.logger.debug(error);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  /**
   * this method is used to get the notice with view
   * @param id the notice id
   * @returns notice object
   */
  async getNoticeWithView(id: number): Promise<NoticeFullContent> {
    this.logger.log(`getNoticeWithView`);
    return this.prismaService.notice
      .update({
        where: {
          id,
          deletedAt: null,
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
          cralws: true,
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
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            this.logger.debug(`Notice with id ${id} not found`);
            throw new NotFoundException(`Notice with id ${id} not found`);
          }
          this.logger.error('getNoticeWithView error');
          this.logger.debug(error);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('getNoticeWithView error');
        this.logger.debug(error);
        throw new InternalServerErrorException('Unknown Error');
      });
  }

  /**
   * this method is used to create the notice
   * @param param0 create notice dto
   * @param userUuid user's uuid
   * @param createdAt created time
   * @returns NoticeFullContent
   */
  async createNotice(
    { title, body, deadline, tags, images, documents }: CreateNoticeDto,
    userUuid: string,
    createdAt?: Date,
  ): Promise<NoticeFullContent> {
    this.logger.log(`createNotice`);
    const findTags = await this.prismaService.tag.findMany({
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
          createdAt: createdAt || new Date(),
          currentDeadline: deadline || null,
          tags: {
            connect: findTags,
          },
          files: {
            create: [
              ...images.map((image, idx) => ({
                order: idx,
                name: title,
                type: FileType.IMAGE,
                url: image,
              })),
              ...documents.map((document, idx) => ({
                order: idx,
                name: title,
                type: FileType.DOCUMENT,
                url: document,
              })),
            ],
          },
        },
        include: {
          tags: true,
          contents: {
            orderBy: {
              id: 'asc',
            },
          },
          cralws: true,
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
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            this.logger.debug(`User uuid not found`);
            throw new NotFoundException(`User uuid not found`);
          }
          this.logger.error('createNotice error');
          this.logger.debug(error);
          throw new InternalServerErrorException('Database Error');
        }
        this.logger.error('createNotice error');
        this.logger.debug(error);
        throw new InternalServerErrorException('Unknown Error');
      });
  }
}
