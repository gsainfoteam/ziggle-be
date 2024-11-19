import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';
import { TagModule } from './tag/tag.module';
import { NoticeModule } from './notice/notice.module';
import { DocumentModule } from './document/document.module';
import { ImageModule } from './image/image.module';
import { CrawlModule } from './crawl/crawl.module';
import { GroupModule } from './group/group.module';
import { FcmModule } from './fcm/fcm.module';
import { BullModule } from '@nestjs/bull';
import { AiModule } from './ai/ai.module';
import { CustomConfigModule, CustomConfigService } from '@lib/custom-config';
import { HealthModule } from './health/health.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    FileModule,
    UserModule,
    TagModule,
    NoticeModule,
    DocumentModule,
    ImageModule,
    CrawlModule,
    GroupModule,
    FcmModule,
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
    RedisModule.forRootAsync({
      imports: [CustomConfigModule],
      inject: [CustomConfigService],
      useFactory: (customConfigService: CustomConfigService) => ({
        type: 'single',
        url: `redis://${customConfigService.REDIS_HOST}:${customConfigService.REDIS_PORT}`,
      }),
    }),
    AiModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
