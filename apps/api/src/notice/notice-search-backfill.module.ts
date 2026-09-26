import { Module } from '@nestjs/common';
import { PrismaModule } from '@lib/prisma';
import { NoticeSearchModule } from '@lib/notice-search';
import { NoticeSearchBackfillService } from './notice-search-backfill.service';

@Module({
  imports: [PrismaModule, NoticeSearchModule],
  providers: [NoticeSearchBackfillService],
  exports: [NoticeSearchBackfillService],
})
export class NoticeSearchBackfillModule {}
