import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';
import { CrawlRepository } from './crawl.repository';

@Module({
  providers: [CrawlService, CrawlRepository],
  controllers: [CrawlController],
})
export class CrawlModule {}
