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

  async getTokensWithCondition(targetUser: FcmTargetUser): Promise<string[][]> {
    let totalTokens;

    if (targetUser === FcmTargetUser.All) {
      totalTokens = (await this.fcmRepository.getAllFcmTokens()).map(
        ({ fcmTokenId }) => fcmTokenId,
      );
    } else {
      //TODO 이 부분은 알림을 허용한 user에게만 알림이 가도록 수정해야 함.
      //(getAllFcmTokens 함수를 다른 함수로 대체해야 한다.)
      totalTokens = (await this.fcmRepository.getAllFcmTokens()).map(
        ({ fcmTokenId }) => fcmTokenId,
      );
    }

    const batches = totalTokens.reduce((acc, token, index) => {
      if (index % 100 === 0) return [[token], ...acc];
      const [first, ...array] = acc;
      return [[...first, token], ...array];
    }, []);

    return batches;
  }

  async postMessageWithDelay(
    noticeId: string,
    notification: Notification,
    targetUser: FcmTargetUser,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokenBatches = await this.getTokensWithCondition(targetUser);

    tokenBatches.forEach(async (tokenBatch, index) => {
      await this.fcmQueue.add(
        { notification, tokens: tokenBatch, data },
        {
          delay: this.customConfigService.FCM_DELAY,
          removeOnComplete: true,
          removeOnFail: true,
          jobId: `${noticeId}-${index}`,
        },
      );
    });
  }

  async postMessageImmediately(
    noticeId: string,
    notification: Notification,
    targetUser: FcmTargetUser,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokenBatches = await this.getTokensWithCondition(targetUser);

    tokenBatches.forEach(async (tokenBatch, index) => {
      await this.postMessage(
        notification,
        tokenBatch,
        `${noticeId}-${index}`,
        data,
      );
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
  ) {
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
