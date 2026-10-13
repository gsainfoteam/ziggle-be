import { Job } from 'bull';
import { mock, mockDeep, DeepMockProxy, MockProxy } from 'jest-mock-extended';
import { PrismaService } from '@lib/prisma';
import { NoticeSearchService } from '@lib/notice-search';
import { LlmService } from '../../shared/llm/llm.service';
import { SummarizeNoticeConsumer } from './summarize-notice.consumer';
import { SummarizeNoticeQueueData } from './types/queue.type';

const VERSION = new Date('2026-01-01T00:00:00Z');
const DEADLINE = new Date('2026-02-01T00:00:00Z');

const buildJob = (
  overrides: Partial<SummarizeNoticeQueueData> = {},
): Job<SummarizeNoticeQueueData> =>
  ({
    data: {
      noticeId: 1,
      content: '본문',
      contentVersion: VERSION.getTime(),
      ...overrides,
    },
  }) as Job<SummarizeNoticeQueueData>;

describe('SummarizeNoticeConsumer', () => {
  let consumer: SummarizeNoticeConsumer;
  let prisma: DeepMockProxy<PrismaService>;
  let tx: DeepMockProxy<PrismaService>;
  let noticeSearchService: MockProxy<NoticeSearchService>;
  let llmService: MockProxy<LlmService>;

  const mockNotice = (
    overrides: Partial<{ summary: string | null; keywords: string[] }> = {},
  ) =>
    prisma.notice.findUniqueOrThrow.mockResolvedValue({
      id: 1,
      lastEditedAt: VERSION,
      currentDeadline: DEADLINE,
      summary: null,
      keywords: [],
      ...overrides,
    } as never);

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    tx = mockDeep<PrismaService>();
    noticeSearchService = mock<NoticeSearchService>();
    llmService = mock<LlmService>();
    prisma.$transaction.mockImplementation(((fn: (tx: unknown) => unknown) =>
      fn(tx)) as never);
    llmService.summarize.mockResolvedValue({
      summary: '요약',
      keywords: ['키워드'],
    });

    consumer = new SummarizeNoticeConsumer(
      prisma,
      noticeSearchService,
      llmService,
    );
  });

  it('saves the summary and refreshes search fields', async () => {
    mockNotice();
    tx.notice.updateMany.mockResolvedValue({ count: 1 });

    await consumer.processSummarization(buildJob());

    expect(llmService.summarize).toHaveBeenCalledWith('본문', DEADLINE);
    expect(tx.notice.updateMany).toHaveBeenCalledWith({
      where: {
        id: 1,
        lastEditedAt: VERSION,
        OR: [{ summary: null }, { keywords: { isEmpty: true } }],
        deletedAt: null,
      },
      data: { summary: '요약', keywords: ['키워드'] },
    });
    expect(noticeSearchService.refresh).toHaveBeenCalledWith(1, tx);
  });

  it('discards the job when the notice was edited after enqueue', async () => {
    mockNotice();

    await consumer.processSummarization(
      buildJob({ contentVersion: VERSION.getTime() - 1 }),
    );

    expect(llmService.summarize).not.toHaveBeenCalled();
  });

  it('skips when both summary and keywords already exist', async () => {
    mockNotice({ summary: '기존 요약', keywords: ['기존'] });

    await consumer.processSummarization(buildJob());

    expect(llmService.summarize).not.toHaveBeenCalled();
  });

  it('regenerates when the summary exists but keywords are empty', async () => {
    mockNotice({ summary: '기존 요약', keywords: [] });
    tx.notice.updateMany.mockResolvedValue({ count: 1 });

    await consumer.processSummarization(buildJob());

    expect(llmService.summarize).toHaveBeenCalled();
  });

  it('does not refresh search fields when nothing was updated', async () => {
    mockNotice();
    tx.notice.updateMany.mockResolvedValue({ count: 0 });

    await consumer.processSummarization(buildJob());

    expect(noticeSearchService.refresh).not.toHaveBeenCalled();
  });

  it('rethrows errors so the queue can retry', async () => {
    mockNotice();
    llmService.summarize.mockRejectedValue(new Error('llm down'));

    await expect(consumer.processSummarization(buildJob())).rejects.toThrow(
      'llm down',
    );
  });
});
