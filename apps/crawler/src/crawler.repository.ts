import { Loggable } from '@lib/logger/decorator/loggable';
import { PrismaService } from '@lib/prisma';
import { Injectable } from '@nestjs/common';
import { Crawl, File, FileType, User } from '@prisma/client';

@Loggable()
@Injectable()
export class CrawlerRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async checkCrawlData(
    url: string,
  ): Promise<(Crawl & { notice: { files: File[] } }) | null> {
    return this.prismaService.crawl.findFirst({
      where: {
        url,
      },
      include: {
        notice: {
          include: {
            files: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }

  async createCrawl(
    {
      title,
      body,
      type,
      crawledAt,
      url,
    }: Pick<Crawl, 'title' | 'body' | 'type' | 'crawledAt' | 'url'>,
    createdAt: Date,
    user: User,
    files?: {
      href: string;
      name: string;
      type: 'doc' | 'hwp' | 'pdf' | 'imgs' | 'xls' | 'etc';
    }[],
  ): Promise<Crawl> {
    return this.prismaService.crawl.create({
      data: {
        title,
        body,
        type,
        url,
        crawledAt,
        notice: {
          create: {
            category: 'ACADEMIC',
            author: {
              connect: user,
            },
            createdAt,
            publishedAt: new Date(),
            files: {
              createMany: {
                data:
                  files?.map((file, index) => ({
                    name: file.name,
                    url: file.href,
                    type: FileType.DOCUMENT,
                    order: index,
                  })) ?? [],
              },
            },
          },
        },
      },
    });
  }

  async updateCrawl(
    { title, body, type }: Pick<Crawl, 'title' | 'body' | 'type'>,
    id: number,
    files: {
      href: string;
      name: string;
      type: 'doc' | 'hwp' | 'pdf' | 'imgs' | 'xls' | 'etc';
    }[],
  ): Promise<Crawl> {
    return this.prismaService.crawl.update({
      where: {
        id,
      },
      data: {
        title,
        body,
        type,
        notice: {
          update: {
            files: {
              deleteMany: {},
              createMany: {
                data:
                  files?.map((file, index) => ({
                    name: file.name,
                    url: file.href,
                    type: FileType.DOCUMENT,
                    order: index,
                  })) ?? [],
              },
            },
          },
        },
      },
    });
  }
}
