import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { apps } from 'firebase-admin';
import { initializeApp, cert } from 'firebase-admin/app';
import { Notification, getMessaging } from 'firebase-admin/messaging';
import { FcmToken } from '../entity/fcmToken.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class FcmService {
  constructor(
    configService: ConfigService,
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepository: Repository<FcmToken>,
  ) {
    if (apps.length !== 0) return;
    initializeApp({
      credential: cert({
        projectId: configService.get<string>('FCM_PROJECT_ID'),
        privateKey: configService
          .get<string>('FCM_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
        clientEmail: configService.get<string>('FCM_CLIENT_EMAIL'),
      }),
    });
  }

  async postMessage(
    notification: Notification,
    tokens: string[],
    data?: Record<string, string>,
  ) {
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

  private async _postMessage(
    notification: Notification,
    tokens: string[],
    data?: Record<string, string>,
  ): Promise<void> {
    const result = await getMessaging().sendEachForMulticast({
      tokens,
      notification,
      apns: { payload: { aps: { mutableContent: true } } },
      data: data,
    });
    console.log(result);
    const responses = result.responses.map((response, index) => ({
      response,
      token: tokens[index],
    }));
    await this.fcmTokenRepository
      .createQueryBuilder()
      .update()
      .whereInIds(
        responses
          .filter(({ response }) => response.success)
          .map((r) => r.token),
      )
      .set({ successCount: () => 'successCount + 1' })
      .execute();
    const failedResponses = responses.filter(
      ({ response }) => !response.success,
    );
    const failedTokens = await this.fcmTokenRepository.findBy({
      token: In(failedResponses.map((r) => r.token)),
    });
    failedTokens.forEach((t) => (t.failCount += 1));
    failedResponses.forEach(({ response }, index) => {
      failedTokens[index].errors = [
        ...new Set([
          ...(failedTokens[index].errors ?? []),
          response.error.code,
        ]),
      ];
    });
    await this.fcmTokenRepository.save(failedTokens);
  }
}
