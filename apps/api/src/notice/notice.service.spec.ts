import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { Category } from '@generated/prisma/client';
import { CustomConfigService } from '@lib/custom-config';
import { FileService } from '@lib/file/file.service';
import { DocumentService } from '../document/document.service';
import { FcmService } from '../fcm/fcm.service';
import { FcmTargetUser } from '../fcm/types/fcmTargetUser.type';
import { ImageService } from '../image/image.service';
import { CreateNoticeDto } from './dto/req/createNotice.dto';
import { NoticeRepository } from './notice.repository';
import { NoticeService } from './notice.service';
import { SummarizeNoticeService } from './summarize-notice/summarize-notice.service';
import { NoticeFullContent } from './types/noticeFullContent';

const USER = 'user-uuid';
const FCM_DELAY = 5 * 60 * 1000;

const buildNotice = (
  overrides: Partial<NoticeFullContent> = {},
): NoticeFullContent =>
  ({
    id: 1,
    views: 0,
    category: Category.ETC,
    currentDeadline: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastEditedAt: new Date('2026-01-01T00:00:00Z'),
    publishedAt: new Date(Date.now() + FCM_DELAY),
    deletedAt: null,
    summary: null,
    keywords: [],
    authorId: USER,
    groupId: null,
    author: { name: 'author', uuid: USER, picture: null },
    group: null,
    contents: [
      {
        id: 1,
        lang: 'ko',
        title: '제목',
        body: '<p>본문 <a href="https://x.com">링크</a></p>',
        deadline: null,
        createdAt: new Date(),
        noticeId: 1,
      },
    ],
    crawls: [],
    tags: [],
    files: [],
    reactions: [],
    reminders: [],
    UserRecord: [],
    ...overrides,
  }) as unknown as NoticeFullContent;

const buildCreateDto = (
  overrides: Partial<CreateNoticeDto> = {},
): CreateNoticeDto =>
  ({
    title: '제목',
    body: '본문',
    category: Category.ETC,
    tags: [],
    images: [],
    documents: [],
    ...overrides,
  }) as CreateNoticeDto;

describe('NoticeService', () => {
  let service: NoticeService;
  let imageService: MockProxy<ImageService>;
  let documentService: MockProxy<DocumentService>;
  let fileService: MockProxy<FileService>;
  let noticeRepository: MockProxy<NoticeRepository>;
  let fcmService: MockProxy<FcmService>;
  let summarizeNoticeService: MockProxy<SummarizeNoticeService>;

  beforeEach(() => {
    imageService = mock<ImageService>();
    documentService = mock<DocumentService>();
    fileService = mock<FileService>();
    noticeRepository = mock<NoticeRepository>();
    fcmService = mock<FcmService>();
    summarizeNoticeService = mock<SummarizeNoticeService>();
    const customConfigService = mock<CustomConfigService>({
      FCM_DELAY,
    });

    fileService.getFilesUrl.mockImplementation((key) => key);
    fcmService.postMessageWithDelay.mockResolvedValue(undefined as never);
    fcmService.postMessageImmediately.mockResolvedValue(undefined as never);

    service = new NoticeService(
      imageService,
      documentService,
      fileService,
      noticeRepository,
      fcmService,
      customConfigService,
      summarizeNoticeService,
    );
  });

  describe('getNotice', () => {
    it('records the view when isViewed is true', async () => {
      noticeRepository.getNoticeWithView.mockResolvedValue(buildNotice());

      await service.getNotice(1, { isViewed: true }, USER);

      expect(noticeRepository.updateUserRecord).toHaveBeenCalledWith(1, USER);
      expect(noticeRepository.getNoticeWithView).toHaveBeenCalledWith(1, USER);
      expect(noticeRepository.getNotice).not.toHaveBeenCalled();
    });

    it('does not record the view when isViewed is false', async () => {
      noticeRepository.getNotice.mockResolvedValue(buildNotice());

      const result = await service.getNotice(1, { isViewed: false }, USER);

      expect(result.id).toBe(1);
      expect(noticeRepository.updateUserRecord).not.toHaveBeenCalled();
    });
  });

  describe('createNotice', () => {
    it('creates a notice, schedules FCM and queues summarization', async () => {
      const created = buildNotice();
      noticeRepository.createNotice.mockResolvedValue(created);

      const before = Date.now();
      const result = await service.createNotice(buildCreateDto(), USER);

      const [, meta] = noticeRepository.createNotice.mock.calls[0];
      expect(meta.userUuid).toBe(USER);
      expect(meta.publishedAt.getTime()).toBeGreaterThanOrEqual(
        before + FCM_DELAY,
      );

      expect(fcmService.postMessageWithDelay).toHaveBeenCalledWith(
        '1',
        { title: '제목', body: '본문 링크' },
        FcmTargetUser.All,
        { path: '/notice/1' },
      );
      expect(summarizeNoticeService.enqueueSummarization).toHaveBeenCalledWith(
        1,
        created.contents[0].body,
        created.lastEditedAt,
      );
      expect(result.id).toBe(1);
    });

    it('validates images and documents when present', async () => {
      noticeRepository.createNotice.mockResolvedValue(buildNotice());

      await service.createNotice(
        buildCreateDto({ images: ['img'], documents: ['doc'] }),
        USER,
      );

      expect(imageService.validateImages).toHaveBeenCalledWith(['img']);
      expect(documentService.validateDocuments).toHaveBeenCalledWith(['doc']);
    });

    it('skips validation when there are no files', async () => {
      noticeRepository.createNotice.mockResolvedValue(buildNotice());

      await service.createNotice(buildCreateDto(), USER);

      expect(imageService.validateImages).not.toHaveBeenCalled();
      expect(documentService.validateDocuments).not.toHaveBeenCalled();
    });
  });

  describe('sendNotice', () => {
    it('publishes immediately and cancels the delayed message', async () => {
      noticeRepository.getNotice.mockResolvedValue(buildNotice());
      noticeRepository.updatePublishedAt.mockResolvedValue(undefined as never);

      await service.sendNotice(1, USER);

      expect(noticeRepository.updatePublishedAt).toHaveBeenCalledWith(
        1,
        expect.any(Date),
      );
      expect(fcmService.deleteMessageJobIdPattern).toHaveBeenCalledWith('1');
      expect(fcmService.postMessageImmediately).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ title: '제목' }),
        FcmTargetUser.All,
        { path: '/notice/1' },
      );
    });

    it('throws Forbidden when the user is not the author', async () => {
      noticeRepository.getNotice.mockResolvedValue(buildNotice());

      await expect(service.sendNotice(1, 'other')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws Forbidden when the notice was already published', async () => {
      noticeRepository.getNotice.mockResolvedValue(
        buildNotice({ publishedAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.sendNotice(1, USER)).rejects.toThrow(
        'a message already sent',
      );
    });

    it('throws InternalServerError when sending FCM fails', async () => {
      noticeRepository.getNotice.mockResolvedValue(buildNotice());
      noticeRepository.updatePublishedAt.mockResolvedValue(undefined as never);
      fcmService.postMessageImmediately.mockRejectedValue(new Error('fcm'));

      await expect(service.sendNotice(1, USER)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('addNoticeAdditional', () => {
    it('rejects adding a deadline to a notice without one', async () => {
      noticeRepository.getNotice.mockResolvedValue(buildNotice());

      await expect(
        service.addNoticeAdditional(
          { body: '추가', deadline: new Date() } as never,
          1,
          USER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('maps NotFound from the repository to Forbidden', async () => {
      noticeRepository.getNotice.mockResolvedValue(buildNotice());
      noticeRepository.addAdditionalNotice.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        service.addNoticeAdditional({ body: '추가' } as never, 1, USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('queues summarization with all contents joined', async () => {
      const updated = buildNotice();
      updated.contents.push({ ...updated.contents[0], id: 2, body: '추가' });
      noticeRepository.getNotice.mockResolvedValue(buildNotice());
      noticeRepository.addAdditionalNotice.mockResolvedValue(updated);

      await service.addNoticeAdditional({ body: '추가' } as never, 1, USER);

      expect(summarizeNoticeService.enqueueSummarization).toHaveBeenCalledWith(
        1,
        `${updated.contents[0].body}\n\n추가`,
        updated.lastEditedAt,
      );
    });
  });

  describe('updateNotice', () => {
    it('updates within 30 minutes of creation', async () => {
      noticeRepository.getNotice.mockResolvedValue(buildNotice());
      noticeRepository.updateNotice.mockResolvedValue(buildNotice());

      await service.updateNotice({} as never, {} as never, 1, USER);

      expect(noticeRepository.updateNotice).toHaveBeenCalled();
      expect(summarizeNoticeService.enqueueSummarization).toHaveBeenCalled();
    });

    it('throws Forbidden after 30 minutes', async () => {
      noticeRepository.getNotice.mockResolvedValue(
        buildNotice({ createdAt: new Date(Date.now() - 31 * 60 * 1000) }),
      );

      await expect(
        service.updateNotice({} as never, {} as never, 1, USER),
      ).rejects.toThrow(ForbiddenException);
      expect(noticeRepository.updateNotice).not.toHaveBeenCalled();
    });

    it('throws Forbidden when the user is not the author', async () => {
      noticeRepository.getNotice.mockResolvedValue(buildNotice());

      await expect(
        service.updateNotice({} as never, {} as never, 1, 'other'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteNotice', () => {
    it('deletes files and the notice for the author', async () => {
      noticeRepository.getNotice.mockResolvedValue(
        buildNotice({
          files: [{ url: 'a.png' }, { url: 'b.pdf' }],
        } as Partial<NoticeFullContent>),
      );

      await service.deleteNotice(1, USER);

      expect(fcmService.deleteMessageJobIdPattern).toHaveBeenCalledWith('1');
      expect(fileService.deleteFiles).toHaveBeenCalledWith(['a.png', 'b.pdf']);
      expect(noticeRepository.deleteNotice).toHaveBeenCalledWith(1, USER);
    });
  });
});
