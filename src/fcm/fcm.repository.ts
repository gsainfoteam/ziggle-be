import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Content } from './types/content.type';
import { Prisma } from '@prisma/client';

@Injectable()
export class FcmRepository {
  private readonly logger = new Logger(FcmRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async updateFcmtokensSuccess(fcmtokens: string[]): Promise<void> {
    this.logger.log(`Updating FCM token: ${fcmtokens}`);
    await this.prismaService.fcmToken.updateMany({
      where: {
        fcmTokenId: { in: fcmtokens },
      },
      data: {
        successCount: { increment: 1 },
      },
    });
  }

  async updateFcmtokensFail(fcmtokens: string[]): Promise<void> {
    this.logger.log(`Updating FCM token: ${fcmtokens}`);
    await this.prismaService.fcmToken.updateMany({
      where: {
        fcmTokenId: { in: fcmtokens },
      },
      data: {
        failCount: { increment: 1 },
      },
    });
  }

  async createLogs(content: Content, fcmTokenIds: string[]): Promise<void> {
    this.logger.log(`Creating logs for FCM token: ${fcmTokenIds}`);
    const jsonContent = content as unknown as Prisma.JsonObject;
    await this.prismaService.log.createMany({
      data: fcmTokenIds.map((fcmTokenId) => ({
        fcmTokenId,
        content: jsonContent,
      })),
    });
    return;
  }
}
