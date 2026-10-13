import { Queue } from 'bull';
import { getMessaging } from 'firebase-admin/messaging';
import { mock, MockProxy } from 'jest-mock-extended';
import { FcmToken } from '@generated/prisma/client';
import { CustomConfigService } from '@lib/custom-config';
import { UserService } from '../user/user.service';
import { FcmRepository } from './fcm.repository';
import { FcmService } from './fcm.service';
import { FcmTargetUser } from './types/fcmTargetUser.type';

jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(() => ({})),
  cert: jest.fn(),
}));
jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(),
}));

const FCM_DELAY = 1000;
const notification = { title: '제목', body: '본문' };
const data = { path: '/notice/1' };

const buildTokens = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => ({ fcmTokenId: `token-${i}` }) as FcmToken,
  );

const success = { success: true };
const failure = (code: string) => ({
  success: false,
  error: { code, message: code },
});

describe('FcmService', () => {
  let service: FcmService;
  let fcmQueue: MockProxy<Queue>;
  let fcmRepository: MockProxy<FcmRepository>;
  let userService: MockProxy<UserService>;
  const sendEachForMulticast = jest.fn();

  beforeEach(() => {
    fcmQueue = mock<Queue>();
    fcmRepository = mock<FcmRepository>();
    userService = mock<UserService>();
    userService.deleteFcmTokens.mockResolvedValue(undefined as never);
    sendEachForMulticast.mockReset();
    jest
      .mocked(getMessaging)
      .mockReturnValue({ sendEachForMulticast } as never);

    service = new FcmService(
      fcmQueue,
      mock<CustomConfigService>({ FCM_DELAY, FCM_PRIVATE_KEY: 'key' }),
      fcmRepository,
      userService,
    );
  });

  describe('postMessageWithDelay', () => {
    it('splits tokens into batches of 100 and enqueues each with a delay', async () => {
      fcmRepository.getAllFcmTokens.mockResolvedValue(buildTokens(250));

      await service.postMessageWithDelay(
        '1',
        notification,
        FcmTargetUser.All,
        data,
      );

      expect(fcmQueue.add).toHaveBeenCalledTimes(3);
      const calls = fcmQueue.add.mock.calls as unknown as [
        { tokens: string[] },
        { jobId: string; delay: number },
      ][];
      expect(calls.map(([job]) => job.tokens.length)).toEqual([100, 100, 50]);
      expect(calls.map(([, opts]) => opts.jobId)).toEqual([
        '1-0-1',
        '1-1-1',
        '1-2-1',
      ]);
      expect(calls[0][1].delay).toBe(FCM_DELAY);
      expect(calls[0][0]).toEqual(
        expect.objectContaining({ notification, data }),
      );
    });

    it('retries only the failed batches once with attempt 2', async () => {
      fcmRepository.getAllFcmTokens.mockResolvedValue(buildTokens(150));
      fcmQueue.add
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce(new Error('redis'))
        .mockResolvedValue({} as never);

      await service.postMessageWithDelay('1', notification, FcmTargetUser.All);

      expect(fcmQueue.add).toHaveBeenCalledTimes(3);
      const [job, opts] = fcmQueue.add.mock.calls[2] as unknown as [
        { tokens: string[] },
        { jobId: string },
      ];
      expect(job.tokens).toHaveLength(50);
      expect(opts.jobId).toBe('1-0-2');
    });

    it('does not enqueue anything when there are no tokens', async () => {
      fcmRepository.getAllFcmTokens.mockResolvedValue([]);

      await service.postMessageWithDelay('1', notification, FcmTargetUser.All);

      expect(fcmQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('deleteMessageJobIdPattern', () => {
    it('removes every job for the notice', async () => {
      await service.deleteMessageJobIdPattern('1');

      expect(fcmQueue.removeJobs).toHaveBeenCalledWith('1-*');
    });
  });

  describe('_postMessage', () => {
    it('classifies tokens into succeeded, invalid and retryable', async () => {
      sendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 2,
        responses: [
          success,
          failure('messaging/registration-token-not-registered'),
          failure('messaging/internal-error'),
        ],
      });

      const retry = await service._postMessage(
        notification,
        ['ok', 'invalid', 'retry'],
        data,
      );

      expect(sendEachForMulticast).toHaveBeenCalledWith({
        tokens: ['ok', 'invalid', 'retry'],
        notification,
        data,
      });
      expect(retry).toEqual(['retry']);
      expect(userService.deleteFcmTokens).toHaveBeenCalledWith(['invalid']);
      expect(fcmRepository.updateFcmTokensSuccess).toHaveBeenCalledWith(['ok']);
      expect(fcmRepository.updateFcmTokensFail).toHaveBeenCalledWith(['retry']);
      expect(fcmRepository.createLogs).toHaveBeenCalledWith(
        { notification, data },
        ['ok'],
      );
    });

    it('ignores failures while deleting invalid tokens', async () => {
      sendEachForMulticast.mockResolvedValue({
        successCount: 0,
        failureCount: 1,
        responses: [failure('messaging/unregistered')],
      });
      userService.deleteFcmTokens.mockRejectedValue(new Error('db'));

      await expect(
        service._postMessage(notification, ['invalid']),
      ).resolves.toEqual([]);
      expect(fcmRepository.createLogs).toHaveBeenCalled();
    });
  });

  describe('postMessage', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not retry when every token succeeds', async () => {
      sendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [success],
      });

      await service.postMessage(notification, ['ok'], 'job');

      expect(sendEachForMulticast).toHaveBeenCalledTimes(1);
    });

    it('retries retryable tokens once after 2 seconds', async () => {
      jest.useFakeTimers();
      sendEachForMulticast
        .mockResolvedValueOnce({
          successCount: 1,
          failureCount: 1,
          responses: [success, failure('messaging/internal-error')],
        })
        .mockResolvedValueOnce({
          successCount: 1,
          failureCount: 0,
          responses: [success],
        });

      const promise = service.postMessage(notification, ['ok', 'retry'], 'job');
      await jest.advanceTimersByTimeAsync(2000);
      await promise;

      expect(sendEachForMulticast).toHaveBeenCalledTimes(2);
      expect(sendEachForMulticast).toHaveBeenLastCalledWith(
        expect.objectContaining({ tokens: ['retry'] }),
      );
    });
  });

  describe('postMessageImmediately', () => {
    it('sends each batch right away without the queue', async () => {
      fcmRepository.getAllFcmTokens.mockResolvedValue(buildTokens(150));
      sendEachForMulticast.mockImplementation(({ tokens }) =>
        Promise.resolve({
          successCount: tokens.length,
          failureCount: 0,
          responses: tokens.map(() => success),
        }),
      );

      await service.postMessageImmediately(
        '1',
        notification,
        FcmTargetUser.All,
      );

      expect(fcmQueue.add).not.toHaveBeenCalled();
      expect(sendEachForMulticast).toHaveBeenCalledTimes(2);
    });

    it('swallows errors from sending', async () => {
      fcmRepository.getAllFcmTokens.mockResolvedValue(buildTokens(1));
      sendEachForMulticast.mockRejectedValue(new Error('firebase'));

      await expect(
        service.postMessageImmediately('1', notification, FcmTargetUser.All),
      ).resolves.toBeUndefined();
    });
  });
});
