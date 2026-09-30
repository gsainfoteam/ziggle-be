import { Module } from '@nestjs/common';
import { CustomConfigModule } from '@lib/custom-config';
import { NoticeSearchModule } from '@lib/notice-search';
import { PrismaModule } from '@lib/prisma';
import { LlmService } from '../apps/api/src/shared/llm/llm.service';

@Module({
  imports: [CustomConfigModule, PrismaModule, NoticeSearchModule],
  providers: [LlmService],
})
export class BackfillNoticeSummariesModule {}
