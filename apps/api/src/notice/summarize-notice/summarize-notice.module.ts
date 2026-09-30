import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SummarizeNoticeService } from './summarize-notice.service';
import { SummarizeNoticeConsumer } from './summarize-notice.consumer';
import { LlmService } from '../../shared/llm/llm.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'summarize-notice' })],
  providers: [SummarizeNoticeService, SummarizeNoticeConsumer, LlmService],
  exports: [SummarizeNoticeService],
})
export class SummarizeNoticeModule {}
