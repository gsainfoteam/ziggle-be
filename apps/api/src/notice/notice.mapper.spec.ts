import { mock } from 'jest-mock-extended';
import { Category, FileType } from '@generated/prisma/client';
import { FileService } from '@lib/file/file.service';
import {
  toExpandedNoticeDto,
  toGeneralNoticeDto,
  toGeneralNoticeListDto,
} from './notice.mapper';
import { NoticeFullContent } from './types/noticeFullContent';
import { NoticeListContent } from './types/noticeListContent';

const createdAt = new Date('2026-01-01T00:00:00Z');
const author = { name: 'author', uuid: 'author-uuid', picture: null };

const buildFullNotice = (
  overrides: Partial<NoticeFullContent> = {},
): NoticeFullContent =>
  ({
    id: 1,
    views: 10,
    category: Category.ETC,
    currentDeadline: null,
    createdAt,
    updatedAt: createdAt,
    lastEditedAt: createdAt,
    publishedAt: createdAt,
    deletedAt: null,
    titleKo: '',
    titleEn: null,
    previewKo: '',
    previewEn: null,
    plainBody: null,
    summary: null,
    keywords: [],
    langs: [],
    deadline: null,
    authorId: author.uuid,
    groupId: null,
    author,
    group: null,
    contents: [
      {
        id: 1,
        lang: 'ko',
        title: '한국어 제목',
        body: '<p>한국어 <a href="https://ziggle.gistory.me">본문</a></p>',
        deadline: null,
        createdAt,
        noticeId: 1,
      },
      {
        id: 1,
        lang: 'en',
        title: 'English title',
        body: '<p>English body</p>',
        deadline: null,
        createdAt,
        noticeId: 1,
      },
    ],
    crawls: [],
    tags: [{ id: 1, name: 'tag1' }],
    files: [],
    reactions: [],
    reminders: [],
    UserRecord: [],
    ...overrides,
  }) as unknown as NoticeFullContent;

const buildListNotice = (
  overrides: Partial<NoticeListContent> = {},
): NoticeListContent =>
  ({
    ...buildFullNotice(),
    titleKo: '한국어 제목',
    titleEn: 'English title',
    previewKo: '한국어 미리보기',
    previewEn: 'English preview',
    langs: ['ko', 'en'],
    ...overrides,
  }) as unknown as NoticeListContent;

describe('notice.mapper', () => {
  const fileService = mock<FileService>();

  beforeEach(() => {
    fileService.getFilesUrl.mockImplementation((key) => `https://cdn/${key}`);
  });

  describe('toGeneralNoticeDto', () => {
    it('uses the korean content by default and strips html for preview', () => {
      const dto = toGeneralNoticeDto(buildFullNotice(), fileService);

      expect(dto.title).toBe('한국어 제목');
      expect(dto.content).toBe('한국어 본문');
      expect(dto.langs).toEqual(['ko', 'en']);
      expect(dto.tags).toEqual(['tag1']);
    });

    it('uses the requested language content', () => {
      const dto = toGeneralNoticeDto(buildFullNotice(), fileService, 'en');

      expect(dto.title).toBe('English title');
      expect(dto.content).toBe('English body');
    });

    it('falls back to the first content when the language is missing', () => {
      const dto = toGeneralNoticeDto(buildFullNotice(), fileService, 'jp');

      expect(dto.title).toBe('한국어 제목');
    });

    it('prefers crawled data over contents', () => {
      const notice = buildFullNotice({
        crawls: [
          {
            id: 1,
            title: 'crawled title',
            body: '<div>crawled body</div>',
            type: 'ACADEMIC',
            url: 'https://gist.ac.kr/notice/1',
            crawledAt: createdAt,
            noticeId: 1,
          },
        ] as NoticeFullContent['crawls'],
      });

      const dto = toGeneralNoticeDto(notice, fileService, 'en');

      expect(dto.title).toBe('crawled title');
      expect(dto.content).toBe('crawled body');
      expect(dto.langs).toEqual(['ko']);
      expect(dto.deadline).toBeNull();
    });

    it('aggregates reactions per emoji and marks the user reaction', () => {
      const notice = buildFullNotice({
        reactions: [
          { emoji: '🔥', userId: 'user-a' },
          { emoji: '🔥', userId: 'user-b' },
          { emoji: '👍', userId: 'user-b' },
        ] as NoticeFullContent['reactions'],
      });

      const dto = toGeneralNoticeDto(notice, fileService, 'ko', 'user-a');

      expect(dto.reactions).toEqual([
        { emoji: '🔥', count: 2, isReacted: true },
        { emoji: '👍', count: 1, isReacted: false },
      ]);
    });

    it('splits files into image urls and documents', () => {
      const notice = buildFullNotice({
        files: [
          { url: 'img.png', name: 'img', type: FileType.IMAGE },
          { url: 'doc.pdf', name: 'doc', type: FileType.DOCUMENT },
        ] as NoticeFullContent['files'],
      });

      const dto = toGeneralNoticeDto(notice, fileService);

      expect(dto.imageUrls).toEqual(['https://cdn/img.png']);
      expect(dto.documents).toEqual([
        expect.objectContaining({ url: 'doc.pdf', name: 'doc' }),
      ]);
    });

    it('reflects reminder and user record state', () => {
      const notice = buildFullNotice({
        reminders: [{ uuid: 'user-a' }] as NoticeFullContent['reminders'],
        UserRecord: [{ isViewed: true, isBookmarked: true }],
      });

      const dto = toGeneralNoticeDto(notice, fileService, 'ko', 'user-a');

      expect(dto.isReminded).toBe(true);
      expect(dto.isViewed).toBe(true);
      expect(dto.isBookmarked).toBe(true);
    });
  });

  describe('toExpandedNoticeDto', () => {
    it('returns raw html content and additional contents except the first', () => {
      const additional = {
        id: 2,
        lang: 'ko',
        title: null,
        body: '추가 공지',
        deadline: null,
        createdAt,
        noticeId: 1,
      };
      const notice = buildFullNotice();
      notice.contents.push(additional);

      const dto = toExpandedNoticeDto(notice, fileService);

      expect(dto.content).toBe(
        '<p>한국어 <a href="https://ziggle.gistory.me">본문</a></p>',
      );
      expect(dto.additionalContents).toEqual([
        {
          id: 2,
          lang: 'ko',
          deadline: null,
          content: '추가 공지',
          createdAt,
        },
      ]);
      expect(dto.crawledUrl).toBeNull();
    });
  });

  describe('toGeneralNoticeListDto', () => {
    it('uses precomputed korean fields by default', () => {
      const dto = toGeneralNoticeListDto([buildListNotice()], 1, fileService);

      expect(dto.total).toBe(1);
      expect(dto.list[0].title).toBe('한국어 제목');
      expect(dto.list[0].content).toBe('한국어 미리보기');
    });

    it('uses english fields when requested', () => {
      const dto = toGeneralNoticeListDto(
        [buildListNotice()],
        1,
        fileService,
        'en',
      );

      expect(dto.list[0].title).toBe('English title');
      expect(dto.list[0].content).toBe('English preview');
    });

    it('falls back to korean fields when english fields are missing', () => {
      const dto = toGeneralNoticeListDto(
        [buildListNotice({ titleEn: null, previewEn: null })],
        1,
        fileService,
        'en',
      );

      expect(dto.list[0].title).toBe('한국어 제목');
      expect(dto.list[0].content).toBe('한국어 미리보기');
    });
  });
});
