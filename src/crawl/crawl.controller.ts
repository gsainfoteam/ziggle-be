import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('crawl')
@Controller('crawl')
export class CrawlController {}
