import { NestFactory } from '@nestjs/core';
import { NoticeSearchService } from '@lib/notice-search';
import { PrismaService } from '@lib/prisma';
import { LlmService } from '../apps/api/src/shared/llm/llm.service';
import { BackfillNoticeSummariesModule } from './backfill-notice-summaries.module';
import pLimit from 'p-limit';

const BATCH_SIZE = 50;
const CONCURRENCY = 5;
const RATE_LIMIT_DELAY_MS = 100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function backfillSummaries() {
  const app = await NestFactory.createApplicationContext(
    BackfillNoticeSummariesModule,
  );
  const prisma = app.get(PrismaService);
  const llmService = app.get(LlmService);
  const noticeSearchService = app.get(NoticeSearchService);
  const limit = pLimit(CONCURRENCY);

  let lastNoticeId = 0;
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const total = await prisma.notice.count({
      where: { summary: null, deletedAt: null },
    });
    console.log(`Found ${total} notices to summarize`);

    while (true) {
      const notices = await prisma.notice.findMany({
        where: {
          id: { gt: lastNoticeId },
          summary: null,
          deletedAt: null,
        },
        select: {
          id: true,
          lastEditedAt: true,
          contents: {
            select: { body: true },
            orderBy: { id: 'asc' },
          },
          crawls: {
            select: { body: true },
            orderBy: { id: 'asc' },
          },
        },
        orderBy: { id: 'desc' },
        take: BATCH_SIZE,
      });

      if (notices.length === 0) break;

      lastNoticeId = notices[notices.length - 1].id;
      await Promise.all(
        notices.map((notice) =>
          limit(async () => {
            processed++;

            const content = notice.crawls[0]?.body || notice.contents[0]?.body;
            if (!content?.trim()) {
              console.log(
                `Notice ${notice.id}: No content to summarize; skipping`,
              );
              skipped++;
              return;
            }

            try {
              const summary = await llmService.summarize(content);
              const saved = await prisma.$transaction(async (tx) => {
                const result = await tx.notice.updateMany({
                  where: {
                    id: notice.id,
                    lastEditedAt: notice.lastEditedAt,
                    summary: null,
                    deletedAt: null,
                  },
                  data: { summary },
                });

                if (result.count === 0) return false;

                await noticeSearchService.refresh(notice.id, tx);
                return true;
              });

              if (saved) {
                console.log(
                  `Notice ${notice.id}: Summary added (${summary.length} chars)`,
                );
              } else {
                console.log(
                  `Notice ${notice.id}: Changed or deleted; skipping update`,
                );
                skipped++;
              }
            } catch (error) {
              failed++;
              console.error(
                `Notice ${notice.id}: Failed to summarize -`,
                error instanceof Error ? error.message : String(error),
              );
            } finally {
              await sleep(RATE_LIMIT_DELAY_MS);
            }
          }),
        ),
      );

      console.log(`Progress: ${processed}/${total}`);
      break;
    }

    console.log(
      `Backfill completed: ${processed} processed, ${skipped} skipped, ${failed} failed.`,
    );
  } finally {
    await app.close();
  }
}

backfillSummaries().catch((error) => {
  console.error('Fatal error:', error);
  process.exitCode = 1;
});
