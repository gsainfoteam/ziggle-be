import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Notification, getMessaging } from 'firebase-admin/messaging';
import { FcmRepository } from './fcm.repository';

@Injectable()
export class FcmService {
  private readonly app: App;
  private readonly logger = new Logger(FcmService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly fcmRepository: FcmRepository,
  ) {
    this.app = initializeApp({
      credential: cert({
        projectId: this.configService.getOrThrow('FCM_PROJECT_ID'),
        clientEmail: this.configService.getOrThrow('FCM_CLIENT_EMAIL'),
        privateKey: this.configService.getOrThrow('FCM_PRIVATE_KEY'),
      }),
    });
  }

  async postMessage(
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
