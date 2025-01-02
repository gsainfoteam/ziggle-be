import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';

@Module({
  imports: [],
  controllers: [CrawlerController],
  providers: [CrawlerService],
})
export class CrawlerModule {}
