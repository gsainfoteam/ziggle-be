import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { PrismaModule } from '@lib/prisma';
import { HttpModule } from '@nestjs/axios';
import { CrawlerRepository } from './crawler.repository';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [CrawlerService, CrawlerRepository],
})
export class CrawlerModule {}
