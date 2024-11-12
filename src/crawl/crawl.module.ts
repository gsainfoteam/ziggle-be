import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { CrawlRepository } from './crawl.repository';
import { UserModule } from 'src/user/user.module';
import { AiModule } from 'src/ai/ai.module';
import { FcmModule } from 'src/fcm/fcm.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';

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
