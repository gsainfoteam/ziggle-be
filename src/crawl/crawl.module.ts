import { Module } from '@nestjs/common';
import { CrawlService } from './crawl.service';
import { CrawlController } from './crawl.controller';

@Module({
  providers: [CrawlService],
  controllers: [CrawlController],
})
export class CrawlModule {}
