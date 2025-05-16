import { Injectable, Logger } from '@nestjs/common';
import { App, cert, initializeApp } from 'firebase-admin/app';
import {
  MulticastMessage,
  Notification,
  getMessaging,
} from 'firebase-admin/messaging';
import { FcmRepository } from './fcm.repository';
import { FcmTargetUser } from './types/fcmTargetUser.type';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';
import { UserService } from '../user/user.service';

@Injectable()
@Loggable()
export class FcmService {
  private readonly app: App;
  private readonly logger = new Logger(FcmService.name);
  constructor(
    @InjectQueue('fcm') private readonly fcmQueue: Queue,
    private readonly customConfigService: CustomConfigService,
    private readonly fcmRepository: FcmRepository,
    private readonly userService: UserService,
  ) {
    this.app = initializeApp({
      credential: cert({
        projectId: this.customConfigService.FCM_PROJECT_ID,
        clientEmail: this.customConfigService.FCM_CLIENT_EMAIL,
        privateKey: this.customConfigService.FCM_PRIVATE_KEY.replace(
          /\\n/g,
          '\n',
        ),
      }),
    });
  }

  private async getTokensWithTargetCondition(
    targetUser: FcmTargetUser,
  ): Promise<string[][]> {
    const tokens =
      targetUser === FcmTargetUser.All
        ? await this.fcmRepository.getAllFcmTokens()
        : // 모든 user 대상이 아닐 경우에 해당하는 함수를 만들어야 함.
          await this.fcmRepository.getAllFcmTokens();

    const totalTokens = tokens.map(({ fcmTokenId }) => fcmTokenId);

    const BATCH_SIZE = 100;

    return createBatches(totalTokens, BATCH_SIZE);
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

  async postMessageImmediately(
    noticeId: string,
    notification: Notification,
    targetUser: FcmTargetUser,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokenBatches = await this.getTokensWithTargetCondition(targetUser);

    await Promise.all(
      tokenBatches.map((batch, idx) =>
        this.postMessage(notification, batch, `${noticeId}-${idx}`, data),
      ),
    ).catch((err) => {
      this.logger.error('Some batches failed.', err);
    });
  }

  async deleteMessageJobIdPattern(name: string): Promise<void> {
    await this.fcmQueue.removeJobs(name);
  }

  async postMessage(
    notification: Notification,
    tokens: string[],
    jobId: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const failedTokensToRetry = await this._postMessage(
      notification,
      tokens,
      data,
    );

    if (failedTokensToRetry.length > 0) {
      this.logger.debug(
        `Retrying ${failedTokensToRetry.length} tokens in job ${jobId}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const secondFailedToken = await this._postMessage(
        notification,
        failedTokensToRetry,
        data,
      );

      if (secondFailedToken.length > 0) {
        this.logger.error(
          `Also failed to send ${secondFailedToken.length} notification in job ${jobId} at second try`,
        );
      } else {
        this.logger.debug(
          `Every failed notifications in job ${jobId} sent successfully at second try`,
        );
      }
    } else {
      this.logger.debug(
        `There was no failed notification in job ${jobId} at first try`,
      );
    }
  }

  async _postMessage(
    notification: Notification,
    tokens: string[],
    data?: Record<string, string>,
  ): Promise<string[]> {
    const message: MulticastMessage = {
      tokens,
      notification,
      apns: { payload: { aps: { mutableContent: true } } },
      data,
    };

    const { responses } = await getMessaging(this.app).sendEachForMulticast(
      message,
    );

    const results = tokens.map((token, idx) => ({
      res: responses[idx],
      token,
    }));

    const succeed = results
      .filter(({ res }) => res.success)
      .map(({ token }) => token);

    const invalidCodes = [
      'messaging/invalid-argument',
      'messaging/unregistered',
      'messaging/third-party-auth-error',
      'messaging/registration-token-not-registered',
    ];

    results
      .filter(({ res }) => !res.success)
      .forEach(({ res }) => {
        this.logger.error(`${res.error?.code}: ${res.error?.message}`);
      });

    const tokensToDelete = results
      .filter(
        ({ res }) =>
          !res.success &&
          res.error?.code &&
          invalidCodes.includes(res.error.code),
      )
      .map(({ token }) => token);

    if (tokensToDelete.length > 0) {
      this.logger.debug(
        `Deleting ${tokensToDelete.length} invalid tokens from database`,
      );
    }

    const failedTokensToRetry = results
      .filter(
        ({ res }) =>
          !res.success &&
          res.error?.code &&
          !invalidCodes.includes(res.error.code),
      )
      .map(({ token }) => token);

    await this.userService.deleteFcmTokens(tokensToDelete).catch((err) => {
      this.logger.warn('Failed to delete fcm tokens but just ignore it', err);
    });

    await this.fcmRepository.updateFcmTokensSuccess(succeed);
    await this.fcmRepository.updateFcmTokensFail(failedTokensToRetry);
    await this.fcmRepository.createLogs({ notification, data }, succeed);

    return failedTokensToRetry;
  }
}

function createBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}
