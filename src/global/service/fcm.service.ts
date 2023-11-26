import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { apps } from 'firebase-admin';
import { cert, initializeApp } from 'firebase-admin/app';
import { getMessaging, Notification } from 'firebase-admin/messaging';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FcmService {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
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
    const responses = result.responses.map((response, index) => ({
      response,
      token: tokens[index],
    }));
    const sucessed = responses.filter(({ response }) => response.success);
    const failed = responses.filter(({ response }) => !response.success);
    await this.prismaService.fcmToken.updateMany({
      where: {
        token: { in: sucessed.map(({ token }) => token) },
      },
      data: {
        successCount: { increment: 1 },
      },
    });
    await this.prismaService.fcmToken.updateMany({
      where: {
        token: { in: failed.map(({ token }) => token) },
      },
      data: {
        failCount: { increment: 1 },
      },
    });
  }
}
