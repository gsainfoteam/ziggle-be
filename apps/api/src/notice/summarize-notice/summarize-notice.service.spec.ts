import { Queue } from 'bull';
import { mock } from 'jest-mock-extended';
import { SummarizeNoticeService } from './summarize-notice.service';
import { SummarizeNoticeQueueData } from './types/queue.type';

describe('SummarizeNoticeService', () => {
  it('enqueues a job keyed by notice id and content version', async () => {
    const queue = mock<Queue<SummarizeNoticeQueueData>>();
    const service = new SummarizeNoticeService(queue);
    const version = new Date('2026-01-01T00:00:00Z');

    await service.enqueueSummarization(1, '본문', version);

    expect(queue.add).toHaveBeenCalledWith(
      { noticeId: 1, content: '본문', contentVersion: version.getTime() },
      { jobId: `notice-summarize-1-${version.getTime()}` },
    );
  });
});
