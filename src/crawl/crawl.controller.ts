import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CrawlService } from './crawl.service';
import { CreateCrawlDto } from './dto/req/createCrawl.dto';

@ApiTags('crawl')
@Controller('crawl')
export class CrawlController {
  constructor(private readonly crawlService: CrawlService) {}

  @ApiOperation({ summary: 'Create a crawl' })
  @ApiOkResponse({ description: 'Crawl created' })
  @ApiForbiddenResponse({ description: 'Invalid password' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post()
  @UsePipes(ValidationPipe)
  async createCrawl(@Body() body: CreateCrawlDto): Promise<void> {
    return this.crawlService.createCrawl(body);
  }
}
