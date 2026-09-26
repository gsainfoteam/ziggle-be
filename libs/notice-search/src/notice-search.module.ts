import { Module } from '@nestjs/common';
import { NoticeSearchRepository } from './notice-search.repository';
import { NoticeSearchService } from './notice-search.service';

@Module({
  providers: [NoticeSearchService, NoticeSearchRepository],
  exports: [NoticeSearchService],
})
export class NoticeSearchModule {}
