import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { FcmToken } from '@prisma/client';

@Injectable()
export class CrawlerFcmRepository {
  private readonly logger = new Logger(CrawlerFcmRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

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
