import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCrawlDto } from './dto/req/createCrawl.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Crawl } from '@prisma/client';

@Injectable()
export class CrawlRepository {
  private readonly logger = new Logger(CrawlRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async createCrawl({
    title,
    body,
    type,
    url,
    authorId,
  }: CreateCrawlDto): Promise<Crawl> {
    this.logger.log('createCrawl');
    return this.prismaService.crawl
      .create({
        data: {
          title,
          body,
          type,
          url,
          notice: {
            create: {
              authorId,
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
}
