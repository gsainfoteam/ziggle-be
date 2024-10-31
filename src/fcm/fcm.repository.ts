import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Content } from './types/content.type';
import { FcmToken, Prisma } from '@prisma/client';
import { PrismaService } from '@lib/prisma';

@Injectable()
export class FcmRepository {
  private readonly logger = new Logger(FcmRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async updateFcmtokensSuccess(fcmtokens: string[]): Promise<void> {
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
    const jsonContent = content as unknown as Prisma.JsonObject;
    await this.prismaService.log.createMany({
      data: fcmTokenIds.map((fcmTokenId) => ({
        fcmTokenId,
        content: jsonContent,
      })),
    });
    return;
  }

  async getAllFcmTokens(): Promise<FcmToken[]> {
    return this.prismaService.fcmToken.findMany().catch((err) => {
      this.logger.error('getAllFcmTokens');
      this.logger.debug(err);
      throw new InternalServerErrorException('Database error');
    });
  }
}
