import { Module } from '@nestjs/common';
import { LoggerModule } from '@lib/logger';
import { NoticeSearchRepository } from './notice-search.repository';
import { NoticeSearchService } from './notice-search.service';

@Module({
  imports: [LoggerModule],
  providers: [NoticeSearchService, NoticeSearchRepository],
  exports: [NoticeSearchService],
})
export class NoticeSearchModule {}
