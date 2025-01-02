import { Controller, Get } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller()
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get()
  getHello(): string {
    return this.crawlerService.getHello();
  }
}
