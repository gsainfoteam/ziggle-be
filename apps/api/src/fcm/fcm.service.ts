import { Injectable, Logger } from '@nestjs/common';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Notification, getMessaging } from 'firebase-admin/messaging';
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

  async postMessageWithDelay(
    jobId: string,
    notification: Notification,
    targetUser: FcmTargetUser,
    data?: Record<string, string>,
  ): Promise<void> {
    await this.fcmQueue.add(
      { notification, targetUser, data },
      {
        delay: this.customConfigService.FCM_DELAY,
        removeOnComplete: true,
        removeOnFail: true,
        jobId,
      },
    );
  }

  async deleteMessageJobIdPattern(name: string): Promise<void> {
    await this.fcmQueue.removeJobs(name);
  }

  async postMessage(
    notification: Notification,
    targetUser: FcmTargetUser,
    data?: Record<string, string>,
  ) {
    let tokens;

    if (targetUser === FcmTargetUser.All) {
      tokens = (await this.fcmRepository.getAllFcmTokens()).map(
        ({ fcmTokenId }) => fcmTokenId,
      );
    } else {
      //TODO 이 부분은 알림을 허용한 user에게만 알림이 가도록 수정해야 함.
      //(getAllFcmTokens 함수를 다른 함수로 대체해야 한다.)
      tokens = (await this.fcmRepository.getAllFcmTokens()).map(
        ({ fcmTokenId }) => fcmTokenId,
      );
    }

    const batches = tokens.reduce((acc, token, index) => {
      if (index % 500 === 0) return [[token], ...acc];
      const [first, ...array] = acc;
      return [[...first, token], ...array];
    }, []);

    await Promise.allSettled(
      batches.map(async (batch, idx) => {
        const failedTokensToRetry = await this._postMessage(
          notification,
          batch,
          data,
        );

        if (failedTokensToRetry.length > 0) {
          this.logger.error(`Some fcm token in batch${idx} failed to send`);
          this.logger.debug(
            `Retrying failed tokens in batch${idx} (${failedTokensToRetry.length} tokens)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const secondFailedToken = await this._postMessage(
            notification,
            failedTokensToRetry,
            data,
          );

          if (secondFailedToken.length > 0) {
            this.logger.error(
              `Also failed to send ${secondFailedToken.length} notification in batch${idx} at second try`,
            );
          } else {
            this.logger.debug(
              `Every failed notifications in batch${idx} sent successfully at second try`,
            );
          }
        } else {
          this.logger.debug(
            `All notifications in batch${idx} sent successfully at first try`,
          );
        }
      }),
    );
  }

  async _postMessage(
    notification: Notification,
    tokens: string[],
    data?: Record<string, string>,
  ): Promise<string[]> {
    // send message to each token
    const result = await Promise.allSettled(
      tokens.map((token) =>
        getMessaging(this.app).send({
          token,
          notification,
          apns: { payload: { aps: { mutableContent: true } } },
          data,
        }),
      ),
    );

    // update success and fail count
    const responses = result.map((res, idx) => ({
      res,
      token: tokens[idx],
    }));

    const succeed = responses.filter(({ res }) => res.status === 'fulfilled');
    const failed = responses.filter(({ res }) => res.status === 'rejected');

    const failedTokensToRetry = (
      await Promise.allSettled(
        failed.map(async ({ res, token }) => {
          if (
            res.status === 'rejected' &&
            [
              'messaging/invalid-argument',
              'messaging/unregistered',
              'messaging/third-party-auth-error',
            ].includes(res.reason.code)
          ) {
            try {
              await this.userService.deleteFcmToken(token);
            } catch (err) {
              this.logger.warn(
                'Failed to delete fcm token but just ignore it',
                err,
              );
            }
            return null;
          }
          return token;
        }),
      )
    )
      .filter(
        (result): result is PromiseFulfilledResult<string | null> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value)
      .filter((token): token is string => token !== null);

    await this.fcmRepository.updateFcmTokensSuccess(
      succeed.map(({ token }) => token),
    );
    await this.fcmRepository.updateFcmTokensFail(failedTokensToRetry);

    await this.fcmRepository.createLogs(
      { notification, data },
      succeed.map(({ token }) => token),
    );

    return failedTokensToRetry;
  }
}
