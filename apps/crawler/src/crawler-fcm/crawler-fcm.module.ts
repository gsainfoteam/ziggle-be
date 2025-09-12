import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from '@lib/logger';
import { PrismaModule } from '@lib/prisma';
import { CustomConfigModule } from '@lib/custom-config';
import { CrawlerFcmService } from './crawler-fcm.service';
import { CrawlerFcmRepository } from './crawler-fcm.repository';

@Module({
  imports: [
    CustomConfigModule,
    PrismaModule,
    BullModule.registerQueue({ name: 'fcm' }),
    LoggerModule,
  ],
  providers: [CrawlerFcmService, CrawlerFcmRepository],
  exports: [CrawlerFcmService],
})
export class CrawlerFcmModule {}
