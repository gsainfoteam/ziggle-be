import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { PrismaModule } from '@lib/prisma';
import { HttpModule } from '@nestjs/axios';
import { CrawlerRepository } from './crawler.repository';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, HttpModule, UserModule],
  providers: [CrawlerService, CrawlerRepository],
  exports: [CrawlerService],
})
export class CrawlerModule {}
