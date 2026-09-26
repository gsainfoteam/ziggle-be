import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { Prisma } from '@generated/prisma/client';
import { NoticeSearchService } from '@lib/notice-search';
import { Loggable } from '@lib/logger/decorator/loggable';

const BATCH_SIZE = 200;

@Injectable()
@Loggable()
export class NoticeSearchBackfillService {
  private readonly logger = new Logger(NoticeSearchBackfillService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly noticeSearchService: NoticeSearchService,
  ) {}

  async run(): Promise<void> {
    const where = { plainBody: null };
    const total = await this.prismaService.notice.count({ where });
    this.logger.log(`backfilling ${total} notices`);

    let succeeded = 0;
    const failed: number[] = [];
    let notices = await this.findBatch(where);

    while (notices.length > 0) {
      for (const { id } of notices) {
        await this.prismaService
          .$transaction((tx) => this.noticeSearchService.refresh(id, tx))
          .then(() => {
            succeeded += 1;
          })
          .catch((error) => {
            failed.push(id);
            this.logger.error(`failed to backfill notice ${id}`, error);
          });
      }

      this.logger.log(`${succeeded + failed.length}/${total}`);
      notices = await this.findBatch(where, notices[notices.length - 1].id);
    }

    this.logger.log(
      `backfill done: ${succeeded} succeeded, ${failed.length} failed`,
    );
    if (failed.length > 0) {
      this.logger.error(`failed notice ids: ${failed.join(', ')}`);
    }
  }

  private findBatch(
    where: Prisma.NoticeWhereInput,
    after?: number,
  ): Promise<{ id: number }[]> {
    return this.prismaService.notice.findMany({
      where: {
        ...where,
        ...(after === undefined ? {} : { id: { gt: after } }),
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
    });
  }
}
