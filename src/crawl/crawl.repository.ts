import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeadlineDetectionService } from 'src/ai/deadline-detection';
import { CreateCrawlDto } from './dto/req/createCrawl.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Crawl, User } from '@prisma/client';
import { GetCrawlDto } from './dto/req/getCrawl.dto';

@Injectable()
export class CrawlRepository {
  private readonly logger = new Logger(CrawlRepository.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly deadlineDetectionService: DeadlineDetectionService,
  ) {}

  async getCrawlData({ url }: GetCrawlDto): Promise<Crawl | null> {
    this.logger.log('getCrawlData');
    return this.prismaService.crawl
      .findFirst({
        where: {
          url,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          this.logger.error(error.message);
          throw new InternalServerErrorException('database error');
        }
        this.logger.error(error);
        throw new InternalServerErrorException('unknown error');
      });
  }

  async createCrawl(
    { title, body, type, url, createdAt }: CreateCrawlDto,
    user: User,
  ): Promise<Crawl> {
    this.logger.log('createCrawl');
    const deadline = await this.deadlineDetectionService.detectDeadline(
      body,
      createdAt,
    );

    return this.prismaService.crawl
      .create({
        data: {
          title,
          body,
          type,
          url,
          notice: {
            create: {
              category: 'ACADEMIC',
              currentDeadline: deadline,
              author: {
                connect: user,
              },
            },
          },
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          this.logger.error(error.message);
          throw new InternalServerErrorException('database error');
        }
        this.logger.error(error);
        throw new InternalServerErrorException('unknown error');
      });
  }

  async updateCrawl(
    { title, body, type }: CreateCrawlDto,
    id: number,
  ): Promise<Crawl> {
    this.logger.log('updateCrawl');
    return this.prismaService.crawl
      .update({
        where: {
          id,
        },
        data: {
          title,
          body,
          type,
        },
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          this.logger.error(error.message);
          throw new InternalServerErrorException('database error');
        }
        this.logger.error(error);
        throw new InternalServerErrorException('unknown error');
      });
  }
}
