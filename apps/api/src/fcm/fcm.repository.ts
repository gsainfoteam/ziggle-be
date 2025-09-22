import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Content } from './types/content.type';
import { FcmToken, Prisma } from '@prisma/client';
import { PrismaService } from '@lib/prisma';
import { Loggable } from '@lib/logger/decorator/loggable';

@Injectable()
@Loggable()
export class FcmRepository {
  private readonly logger = new Logger(FcmRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async updateFcmTokensSuccess(fcmTokens: string[]): Promise<void> {
    await this.prismaService.fcmToken.updateMany({
      where: {
        fcmTokenId: { in: fcmTokens },
      },
      data: {
        successCount: { increment: 1 },
      },
    });
  }

  async updateFcmTokensFail(fcmTokens: string[]): Promise<void> {
    await this.prismaService.fcmToken.updateMany({
      where: {
        fcmTokenId: { in: fcmTokens },
      },
      data: {
        failCount: { increment: 1 },
      },
    });
  }

  async createLogs(content: Content, fcmTokenIds: string[]): Promise<void> {
    const jsonContent = content as unknown as Prisma.JsonObject;
    await this.prismaService.log
      .createMany({
        data: fcmTokenIds.map((fcmTokenId) => ({
          fcmTokenId,
          content: jsonContent,
        })),
      })
      .catch((err) => {
        this.logger.error('createLogs');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
    return;
  }

  async getAllFcmTokens(): Promise<FcmToken[]> {
    return this.prismaService.fcmToken
      .findMany({
        where: {
          userUuid: {
            not: null,
          },
        },
      })
      .catch((err) => {
        this.logger.error('getAllFcmTokens');
        this.logger.debug(err);
        throw new InternalServerErrorException('Database error');
      });
  }
}
