import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CrawlRepository } from './crawl.repository';
import { CreateCrawlDto } from './dto/req/createCrawl.dto';
import { UserService } from 'src/user/user.service';
import { Crawl } from '@prisma/client';
import { GetCrawlDto } from './dto/req/getCrawl.dto';
import { AiService } from 'src/ai/ai.service';
import { FcmService } from 'src/fcm/fcm.service';
import { FcmTargetUser } from 'src/fcm/types/fcmTargetUser.type';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CustomConfigService } from '@lib/custom-config';

@Injectable()
@Loggable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);
  constructor(
    private readonly crawlRepository: CrawlRepository,
    private readonly customConfigService: CustomConfigService,
    private readonly userService: UserService,
    private readonly fcmService: FcmService,
    private readonly aiService: AiService,
  ) {}

  async getCrawlData(dto: GetCrawlDto): Promise<Crawl> {
    if (dto.password !== this.customConfigService.CRAWL_PASSWORD) {
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
    if (dto.password !== this.customConfigService.CRAWL_PASSWORD) {
      this.logger.debug('Invalid password');
      throw new ForbiddenException('Invalid password');
    }
    const user = await this.userService.findOrCreateTempUser({
      name: dto.authorName,
    });
    const deadline = await this.aiService.detectDeadline(
      dto.body,
      dto.createdAt,
    );
    const crawl = await this.crawlRepository.createCrawl(dto, deadline, user);

    const notification = {
      title: crawl.title,
      body: crawl.body,
    };

    await this.fcmService.postMessage(notification, FcmTargetUser.All, {
      path: `/notice/${crawl.noticeId}`,
    });
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
