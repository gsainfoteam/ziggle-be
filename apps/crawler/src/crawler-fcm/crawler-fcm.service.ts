import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CustomConfigService } from '@lib/custom-config';
import { CrawlerFcmRepository } from './crawler-fcm.repository';
import { Notification } from 'firebase-admin/messaging';

export enum FcmTargetUser {
  All = 'all',
  AllowAlarm = 'allowAlarm',
}

@Injectable()
export class CrawlerFcmService {
  private readonly logger = new Logger(CrawlerFcmService.name);

  constructor(
    @InjectQueue('fcm') private readonly fcmQueue: Queue,
    private readonly customConfigService: CustomConfigService,
    private readonly crawlFcmRepository: CrawlerFcmRepository,
  ) {}

  private createBatches<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      out.push(arr.slice(i, i + size));
    }
    return out;
  }

  private async getTokensWithTargetCondition(
    target: FcmTargetUser,
  ): Promise<string[][]> {
    const tokens =
      target === FcmTargetUser.All
        ? await this.crawlFcmRepository.getAllFcmTokens()
        : await this.crawlFcmRepository.getAllFcmTokens();
    const totalTokens = tokens.map(({ fcmTokenId }) => fcmTokenId);
    const BATCH_SIZE = 100;
    return this.createBatches(totalTokens, BATCH_SIZE);
  }

  private async processBatches(
    totalBatches: string[][],
    noticeId: string,
    notification: Notification,
    attempt: number,
    data?: Record<string, string>,
  ): Promise<string[][]> {
    const batchProcessResult = await Promise.allSettled(
      totalBatches.map((tokens, index) =>
        this.fcmQueue.add(
          { notification, tokens, data },
          {
            delay: this.customConfigService.FCM_DELAY,
            removeOnComplete: true,
            removeOnFail: true,
            jobId: `${noticeId}-${index}-${attempt}`,
          },
        ),
      ),
    );

    const failedBatches = batchProcessResult
      .map((res, idx) => ({ res, idx }))
      .filter(({ res }) => res.status === 'rejected')
      .map(({ idx }) => totalBatches[idx]);

    if (failedBatches.length === 0) {
      this.logger.debug(
        `All ${totalBatches.length} batches were added successfully in attempt ${attempt}`,
      );
      return [];
    }

    this.logger.error(
      `Failed to process ${failedBatches.length} batches out of ${totalBatches.length} in attempt ${attempt}`,
    );
    return failedBatches;
  }

  async postMessageWithDelay(
    noticeId: string,
    notification: Notification,
    targetUser: FcmTargetUser,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokenBatches = await this.getTokensWithTargetCondition(targetUser);

    const failedBatches = await this.processBatches(
      tokenBatches,
      noticeId,
      notification,
      1,
      data,
    );

    if (failedBatches.length > 0) {
      this.logger.debug(
        `Retrying ${failedBatches.length} batches in attempt 2`,
      );
      await this.processBatches(failedBatches, noticeId, notification, 2, data);
    }
  }
}
