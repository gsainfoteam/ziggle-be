import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { CrawlRepository } from './crawl.repository';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { UserModule } from '../user/user.module';
import { AiModule } from '../ai/ai.module';
import { FcmModule } from '../fcm/fcm.module';

@Module({
  imports: [
    PrismaModule,
    CustomConfigModule,
    UserModule,
    AiModule,
    FcmModule,
    LoggerModule,
  ],
  providers: [CrawlService, CrawlRepository],
  controllers: [CrawlController],
})
export class CrawlModule {}
