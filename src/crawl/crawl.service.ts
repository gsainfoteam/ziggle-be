import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CrawlRepository } from './crawl.repository';
import { CreateCrawlDto } from './dto/req/createCrawl.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);
  constructor(
    private readonly crawlRepository: CrawlRepository,
    private readonly configService: ConfigService,
  ) {}

  async createCrawl(dto: CreateCrawlDto): Promise<void> {
    this.logger.log('createCrawl');
    if (dto.password !== this.configService.get<string>('CRAWL_PASSWORD')) {
      this.logger.debug('Invalid password');
      throw new ForbiddenException('Invalid password');
    }
    await this.crawlRepository.createCrawl(dto);
  }
}
