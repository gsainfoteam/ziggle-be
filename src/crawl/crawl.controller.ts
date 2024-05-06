import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CrawlService } from './crawl.service';
import { CreateCrawlDto } from './dto/req/createCrawl.dto';
import { GetCrawlDto } from './dto/req/getCrawl.dto';
import { Crawl } from '@prisma/client';

@ApiTags('crawl')
@Controller('crawl')
@UsePipes(ValidationPipe)
export class CrawlController {
  constructor(private readonly crawlService: CrawlService) {}

  @ApiOperation({ summary: 'Get crawl data' })
  @ApiOkResponse({ description: 'Return crawl data' })
  @ApiForbiddenResponse({ description: 'Invalid password' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get()
  async getCrawlData(@Param() param: GetCrawlDto): Promise<Crawl> {
    return this.crawlService.getCrawlData(param);
  }

  @ApiOperation({ summary: 'Create a crawl' })
  @ApiOkResponse({ description: 'Crawl created' })
  @ApiForbiddenResponse({ description: 'Invalid password' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post()
  async createCrawl(@Body() body: CreateCrawlDto): Promise<void> {
    return this.crawlService.createCrawl(body);
  }

  @ApiOperation({ summary: 'Update a crawl' })
  @ApiOkResponse({ description: 'Crawl updated' })
  @ApiForbiddenResponse({ description: 'Invalid password' })
  @ApiNotFoundResponse({ description: 'Crawl not found' })
  @Patch()
  async updateCrawl(@Body() body: CreateCrawlDto): Promise<void> {
    return this.crawlService.updateCrawl(body);
  }
}
