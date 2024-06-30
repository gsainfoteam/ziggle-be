import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { CrawlRepository } from './crawl.repository';
import { DeadlineDetectionService } from 'src/ai/deadline-detection';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, ConfigModule, UserModule, HttpModule],
  providers: [CrawlService, CrawlRepository, DeadlineDetectionService],
  controllers: [CrawlController],
})
export class CrawlModule {}
