import { Loggable } from '@lib/logger/decorator/loggable';
import { PrismaService } from '@lib/prisma';
import { NoticeSearchService } from '@lib/notice-search';
import { Injectable } from '@nestjs/common';
import { Crawl, File, FileType, User } from '@generated/prisma/client';
import { firstValueFrom, from, timeout } from 'rxjs';

@Loggable()
@Injectable()
export class CrawlerRepository {
  private readonly databaseReadTimeoutMs = 30_000;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly noticeSearchService: NoticeSearchService,
  ) {}

  private readWithTimeout<T>(query: PromiseLike<T>): Promise<T> {
    return firstValueFrom(
      from(query).pipe(timeout(this.databaseReadTimeoutMs)),
    );
  }

  async hasOrdinaryCrawls(
    sourceUrl: string,
    pinnedUrls: string[],
  ): Promise<boolean> {
    return (
      (await this.readWithTimeout(
        this.prismaService.crawl.findFirst({
          where: {
            url: { startsWith: `${sourceUrl}?mode=V&no=`, notIn: pinnedUrls },
          },
          select: { id: true },
        }),
      )) !== null
    );
  }

  async checkCrawlData(
    url: string,
  ): Promise<(Crawl & { notice: { files: File[] } }) | null> {
    return this.readWithTimeout(
      this.prismaService.crawl.findFirst({
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
      }),
    );
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
