import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { CrawlRepository } from './crawl.repository';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { AiModule } from 'src/ai/ai.module';
import { FcmModule } from 'src/fcm/fcm.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { RedisCacheModule } from '@lib/redis-cache';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    UserModule,
    AiModule,
    FcmModule,
    LoggerModule,
    RedisCacheModule,
  ],
  providers: [CrawlService, CrawlRepository],
  controllers: [CrawlController],
})
export class CrawlModule {}
