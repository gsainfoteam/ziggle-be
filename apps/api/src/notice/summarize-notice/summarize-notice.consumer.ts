import { Process, Processor, OnQueueFailed, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Inject } from '@nestjs/common';
import { SummarizeNoticeQueueData } from './types/queue.type';
import { PrismaService } from '@lib/prisma';
import { NoticeSearchService } from '@lib/notice-search';
import { LlmService } from '../../shared/llm/llm.service';

@Processor('summarize-notice')
export class SummarizeNoticeConsumer {
  private readonly logger = new Logger(SummarizeNoticeConsumer.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly noticeSearchService: NoticeSearchService,
    private readonly llmService: LlmService,
  ) {}

  @Process()
  async processSummarization(
    job: Job<SummarizeNoticeQueueData>,
  ): Promise<void> {
    const { noticeId, content, contentVersion } = job.data;

    try {
      // Fetch the latest notice
      const notice = await this.prismaService.notice.findUniqueOrThrow({
        where: { id: noticeId },
        select: {
          id: true,
          lastEditedAt: true,
          summary: true,
          keywords: true,
          contents: {
            select: { lang: true, title: true, body: true },
            orderBy: { id: 'asc' },
          },
          crawls: {
            select: { title: true, body: true },
            orderBy: { id: 'asc' },
          },
          tags: { select: { name: true } },
        },
      });

      // Check version: if notice content was edited since job was queued, discard this job
      if (notice.lastEditedAt.getTime() !== contentVersion) {
        this.logger.debug(
          `Notice ${noticeId} was updated after job was queued. Discarding job.`,
        );
        return;
      }

      // Skip only when both the summary and searchable keywords exist.
      if (notice.summary && notice.keywords.length > 0) {
        this.logger.debug(
          `Summary and keywords already exist for notice ${noticeId}. Skipping.`,
        );
        return;
      }

      // Generate summary using LLM
      const { summary, keywords } = await this.llmService.summarize(content);

      // Save summary and refresh search fields in a transaction
      const saved = await this.prismaService.$transaction(async (tx) => {
        const result = await tx.notice.updateMany({
          where: {
            id: noticeId,
            lastEditedAt: new Date(contentVersion),
            OR: [{ summary: null }, { keywords: { isEmpty: true } }],
            deletedAt: null,
          },
          data: { summary, keywords },
        });

        if (result.count === 0) {
          return false;
        }

        // Refresh search fields (will include summary in plainBody)
        await this.noticeSearchService.refresh(noticeId, tx);
        return true;
      });

      if (saved) {
        this.logger.debug(`Summary generated for notice ${noticeId}`);
      } else {
        this.logger.debug(
          `Notice ${noticeId} changed or was deleted before summary could be saved. Skipping.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to generate summary for notice ${noticeId}: ${error.message}`,
        error.stack,
      );
      throw error; // Queue will retry
    }
  }

  @OnQueueFailed()
  onFailed(job: Job<SummarizeNoticeQueueData>, error: Error): void {
    this.logger.error(
      `Summarization job failed for notice ${job.data.noticeId}: ${error.message}`,
    );
  }

  @OnQueueError()
  onError(error: Error): void {
    this.logger.error(`Summarization queue error: ${error.message}`);
  }
}
