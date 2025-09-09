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
  constructor(private readonly prisma: PrismaService) {}

  async getAllFcmTokens(): Promise<FcmToken[]> {
    // API의 FcmRepository와 동일한 쿼리
    try {
      return await this.prisma.fcmToken.findMany();
    } catch (err) {
      this.logger.error('getAllFcmTokens');
      this.logger.debug(err);
      throw new InternalServerErrorException('Database error');
    }
  }
}
