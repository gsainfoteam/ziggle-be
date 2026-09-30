import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SummarizeNoticeService } from './summarize-notice.service';
import { SummarizeNoticeConsumer } from './summarize-notice.consumer';
import { LlmService } from '../../shared/llm/llm.service';
import { PrismaModule } from '@lib/prisma';
import { NoticeSearchModule } from '@lib/notice-search';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'summarize-notice' }),
    PrismaModule,
    NoticeSearchModule,
    CustomConfigModule,
  ],
  providers: [SummarizeNoticeService, SummarizeNoticeConsumer, LlmService],
  exports: [SummarizeNoticeService],
})
export class SummarizeNoticeModule {}
