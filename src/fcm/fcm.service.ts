import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Notification, getMessaging } from 'firebase-admin/messaging';
import { FcmRepository } from './fcm.repository';
import { FcmTargetUser } from './types/fcmTargetUser.type';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class FcmService {
  private readonly app: App;
  private readonly logger = new Logger(FcmService.name);
  constructor(
    @InjectQueue('fcm') private readonly fcmQueue: Queue,
    private readonly configService: ConfigService,
    private readonly fcmRepository: FcmRepository,
  ) {
    this.app = initializeApp({
      credential: cert({
        projectId: this.configService.getOrThrow('FCM_PROJECT_ID'),
        clientEmail: this.configService.getOrThrow('FCM_CLIENT_EMAIL'),
        privateKey: this.configService
          .getOrThrow('FCM_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
      }),
    });
  }

  async postMessageWithDelay(
    name: string,
    notification: Notification,
    targetUser: FcmTargetUser,
    data?: Record<string, string>,
  ): Promise<void> {
    await this.fcmQueue.add(
      { notification, targetUser, data },
      {
        delay: this.configService.getOrThrow<number>('FCM_DELAY'),
        removeOnComplete: true,
        removeOnFail: true,
        jobId: name,
      },
    );
  }

  async deleteMessage(name: string): Promise<void> {
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

    await Promise.all(
      tokens
        .reduce((acc, token, index) => {
          if (index % 500 === 0) return [[token], ...acc];
          const [first, ...array] = acc;
          return [[...first, token], ...array];
        }, [])
        .map((subTokens) => this._postMessage(notification, subTokens, data)),
    );
  }

  async _postMessage(
    notification: Notification,
    tokens: string[],
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.log(`Sending message to ${tokens.length} tokens`);
    // send message to each token
    const result = await getMessaging(this.app).sendEachForMulticast({
      tokens,
      notification,
      apns: { payload: { aps: { mutableContent: true } } },
      data,
    });

    // update success and fail count
    const responses = result.responses.map((res, idx) => ({
      res,
      token: tokens[idx],
    }));
    const sucessed = responses.filter(({ res }) => res.success);
    const failed = responses.filter(({ res }) => !res.success);

    await this.fcmRepository.updateFcmtokensSuccess(
      sucessed.map(({ token }) => token),
    );
    await this.fcmRepository.updateFcmtokensFail(
      failed.map(({ token }) => token),
    );

    // create logs
    await this.fcmRepository.createLogs(
      { notification, data },
      sucessed.map(({ token }) => token),
    );
  }
}
