import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SummarizeNoticeQueueData } from './types/queue.type';

@Injectable()
export class SummarizeNoticeService {
  constructor(
    @InjectQueue('summarize-notice')
    private readonly summarizeNoticeQueue: Queue<SummarizeNoticeQueueData>,
  ) {}

  async enqueueSummarization(
    noticeId: number,
    content: string,
    contentVersion: Date,
  ): Promise<void> {
    await this.summarizeNoticeQueue.add(
      {
        noticeId,
        content,
        contentVersion: contentVersion.getTime(),
      },
      {
        jobId: `notice-summarize-${noticeId}`,
      },
    );
  }
}
