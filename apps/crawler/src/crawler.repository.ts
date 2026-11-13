import { Loggable } from '@lib/logger/decorator/loggable';
import { PrismaService } from '@lib/prisma';
import { NoticeSearchService } from '@lib/notice-search';
import { Injectable } from '@nestjs/common';
import { Crawl, File, FileType, User } from '@generated/prisma/client';

@Loggable()
@Injectable()
export class CrawlerRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly noticeSearchService: NoticeSearchService,
  ) {}

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
    return this.prismaService.$transaction(async (tx) => {
      const crawl = await tx.crawl.create({
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

      await this.noticeSearchService.refresh(crawl.noticeId, tx);

      return crawl;
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
    return this.prismaService.$transaction(async (tx) => {
      const crawl = await tx.crawl.update({
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

      await this.noticeSearchService.refresh(crawl.noticeId, tx);

      return crawl;
    });
  }
}
