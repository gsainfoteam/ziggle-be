import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CustomConfigService } from '@lib/custom-config';
import { CrawlerFcmRepository } from './crawler-fcm.repository';

export enum FcmTargetUser {
  All = 'all',
  AllowAlarm = 'allowAlarm',
}

type NotificationLike = {
  title: string;
  body?: string;
  imageUrl?: string;
};

@Injectable()
export class CrawlerFcmService {
  private readonly logger = new Logger(CrawlerFcmService.name);

  constructor(
    @InjectQueue('fcm') private readonly fcmQueue: Queue,
    private readonly config: CustomConfigService,
    private readonly repo: CrawlerFcmRepository,
  ) {}

  private createBatches<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  private async getTokensWithTargetCondition(
    target: FcmTargetUser,
  ): Promise<string[][]> {
    const tokens =
      target === FcmTargetUser.All
        ? await this.repo.getAllFcmTokens()
        : await this.repo.getAllFcmTokens();
    const ids = tokens.map(({ fcmTokenId }) => fcmTokenId);
    const BATCH_SIZE = 100;
    return this.createBatches(ids, BATCH_SIZE);
  }

  private async processBatches(
    batches: string[][],
    name: string, // 잡 그룹 키 (noticeId 사용)
    notification: NotificationLike,
    attempt: number,
    data?: Record<string, string>,
  ): Promise<string[][]> {
    const results = await Promise.allSettled(
      batches.map((tokens, index) =>
        this.fcmQueue.add(
          { notification, tokens, data }, // API Consumer가 그대로 사용
          {
            delay: this.config.FCM_DELAY, // 지연 전송
            removeOnComplete: true,
            removeOnFail: true,
            jobId: `${name}-${index}-${attempt}`, // 패턴 호환
          },
        ),
      ),
    );

    const failed = results
      .map((res, idx) => ({ res, idx }))
      .filter(({ res }) => res.status === 'rejected')
      .map(({ idx }) => batches[idx]);

    if (failed.length === 0) {
      this.logger.debug(
        `All ${batches.length} batches enqueued (attempt ${attempt}).`,
      );
      return [];
    }
    this.logger.error(
      `Failed ${failed.length}/${batches.length} batches (attempt ${attempt}).`,
    );
    return failed;
  }

  async postMessageWithDelay(
    name: string, // noticeId 문자열 사용
    notification: NotificationLike,
    target: FcmTargetUser,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokenBatches = await this.getTokensWithTargetCondition(target);
    const failed1 = await this.processBatches(
      tokenBatches,
      name,
      notification,
      1,
      data,
    );
    if (failed1.length > 0) {
      this.logger.debug(`Retrying ${failed1.length} batches (attempt 2)`);
      await this.processBatches(failed1, name, notification, 2, data);
    }
  }

  async deleteMessageJobIdPattern(name: string): Promise<void> {
    await this.fcmQueue.removeJobs(`${name}-*`);
  }
}
