import { Queue } from 'bull';
import { mock, MockProxy } from 'jest-mock-extended';
import { FcmToken } from '@generated/prisma/client';
import { CustomConfigService } from '@lib/custom-config';
import { CrawlerFcmRepository } from './crawler-fcm.repository';
import { CrawlerFcmService, FcmTargetUser } from './crawler-fcm.service';

const FCM_DELAY = 1000;
const notification = { title: '제목', body: '본문' };

const buildTokens = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => ({ fcmTokenId: `token-${i}` }) as FcmToken,
  );

type AddCall = [{ tokens: string[] }, { jobId: string; delay: number }];

describe('CrawlerFcmService', () => {
  let service: CrawlerFcmService;
  let fcmQueue: MockProxy<Queue>;
  let repository: MockProxy<CrawlerFcmRepository>;

  beforeEach(() => {
    fcmQueue = mock<Queue>();
    repository = mock<CrawlerFcmRepository>();
    service = new CrawlerFcmService(
      fcmQueue,
      mock<CustomConfigService>({ FCM_DELAY }),
      repository,
    );
  });

  it('enqueues tokens in batches of 100 with a delay', async () => {
    repository.getAllFcmTokens.mockResolvedValue(buildTokens(201));

    await service.postMessageWithDelay('7', notification, FcmTargetUser.All, {
      path: '/notice/7',
    });

    const calls = fcmQueue.add.mock.calls as unknown as AddCall[];
    expect(calls.map(([job]) => job.tokens.length)).toEqual([100, 100, 1]);
    expect(calls.map(([, opts]) => opts.jobId)).toEqual([
      '7-0-1',
      '7-1-1',
      '7-2-1',
    ]);
    expect(calls.every(([, opts]) => opts.delay === FCM_DELAY)).toBe(true);
  });

  it('retries failed batches once with attempt 2', async () => {
    repository.getAllFcmTokens.mockResolvedValue(buildTokens(100));
    fcmQueue.add
      .mockRejectedValueOnce(new Error('redis'))
      .mockResolvedValue({} as never);

    await service.postMessageWithDelay('7', notification, FcmTargetUser.All);

    const calls = fcmQueue.add.mock.calls as unknown as AddCall[];
    expect(calls.map(([, opts]) => opts.jobId)).toEqual(['7-0-1', '7-0-2']);
  });
});
