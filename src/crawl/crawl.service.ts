import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CrawlRepository } from './crawl.repository';
import { CreateCrawlDto } from './dto/req/createCrawl.dto';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { Crawl } from '@prisma/client';
import { GetCrawlDto } from './dto/req/getCrawl.dto';

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);
  constructor(
    private readonly crawlRepository: CrawlRepository,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async getCrawlData(dto: GetCrawlDto): Promise<Crawl> {
    this.logger.log('getCrawlData');
    if (dto.password !== this.configService.get<string>('CRAWL_PASSWORD')) {
      this.logger.debug('Invalid password');
      throw new ForbiddenException('Invalid password');
    }
    const crawl = await this.crawlRepository.getCrawlData(dto);
    if (!crawl) {
      throw new NotFoundException('Crawl not found');
    }
    return crawl;
  }

  async createCrawl(dto: CreateCrawlDto): Promise<void> {
    this.logger.log('createCrawl');
    if (dto.password !== this.configService.get<string>('CRAWL_PASSWORD')) {
      this.logger.debug('Invalid password');
      throw new ForbiddenException('Invalid password');
    }
    const user = await this.userService.findOrCreateTempUser({
      name: dto.authorName,
    });
    await this.crawlRepository.createCrawl(dto, user);
  }

  async updateCrawl(dto: CreateCrawlDto): Promise<void> {
    const crawl = await this.crawlRepository.getCrawlData({
      url: dto.url,
      password: dto.password,
    });

    if (!crawl) {
      throw new NotFoundException('Crawl not found');
    }

    await this.crawlRepository.updateCrawl(dto, crawl.id);
  }
}
