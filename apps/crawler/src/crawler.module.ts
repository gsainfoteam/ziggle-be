import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { PrismaModule } from '@lib/prisma';
import { HttpModule } from '@nestjs/axios';
import { CrawlerRepository } from './crawler.repository';
import { UserModule } from './user/user.module';
import { LoggerModule } from '@lib/logger';
import { CrawlerFcmModule } from './crawler-fcm/crawler-fcm.module';
import { BullModule } from '@nestjs/bull';
import { CustomConfigService } from '@lib/custom-config';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    UserModule,
    LoggerModule,
    BullModule.forRootAsync({
      imports: [CustomConfigModule],
      inject: [CustomConfigService],
      useFactory: (customConfigService: CustomConfigService) => ({
        redis: {
          host: customConfigService.REDIS_HOST,
          port: customConfigService.REDIS_PORT,
        },
      }),
    }),
    CrawlerFcmModule,
  ],
  providers: [CrawlerService, CrawlerRepository],
  exports: [CrawlerService],
})
export class CrawlerModule {}
