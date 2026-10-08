import { mock, MockProxy } from 'jest-mock-extended';
import { Prisma } from '@generated/prisma/client';
import { NoticeSearchRepository } from './notice-search.repository';
import { NoticeSearchService } from './notice-search.service';

type Source = Awaited<ReturnType<NoticeSearchRepository['getSource']>>;

const deadline = new Date('2026-12-31T00:00:00Z');

const buildSource = (overrides: Partial<Source> = {}): Source =>
  ({
    summary: null,
    keywords: [],
    tags: [],
    crawls: [],
    contents: [
      {
        lang: 'ko',
        title: '한국어 제목',
        body: '<p>한국어 <a href="https://ziggle.gistory.me">본문</a></p>',
        deadline,
      },
      {
        lang: 'en',
        title: 'English title',
        body: '<p>English body</p>',
        deadline: null,
      },
    ],
    ...overrides,
  }) as Source;

describe('NoticeSearchService', () => {
  const tx = {} as Prisma.TransactionClient;
  let repository: MockProxy<NoticeSearchRepository>;
  let service: NoticeSearchService;

  beforeEach(() => {
    repository = mock<NoticeSearchRepository>();
    service = new NoticeSearchService(repository);
  });

  const lastUpdate = () => repository.updateSearchFields.mock.calls[0][1];

  it('builds localized search fields from contents', async () => {
    repository.getSource.mockResolvedValue(buildSource());

    await service.refresh(1, tx);

    expect(repository.getSource).toHaveBeenCalledWith(1, tx);
    expect(repository.updateSearchFields).toHaveBeenCalledWith(
      1,
      expect.anything(),
      tx,
    );
    expect(lastUpdate()).toEqual({
      titleKo: '한국어 제목',
      titleEn: 'English title',
      previewKo: '한국어 본문',
      previewEn: 'English body',
      plainBody: '한국어 본문 English body 한국어 제목 English title',
      langs: ['ko', 'en'],
      deadline,
    });
  });

  it('uses only the first content per language for title and preview', async () => {
    const source = buildSource();
    source.contents.push({
      lang: 'ko',
      title: null,
      body: '추가 공지',
      deadline: null,
    } as Source['contents'][number]);
    repository.getSource.mockResolvedValue(source);

    await service.refresh(1, tx);

    expect(lastUpdate().titleKo).toBe('한국어 제목');
    expect(lastUpdate().previewKo).toBe('한국어 본문');
    expect(lastUpdate().plainBody).toContain('추가 공지');
  });

  it('uses crawls as korean source when present', async () => {
    repository.getSource.mockResolvedValue(
      buildSource({
        crawls: [{ title: '크롤링 제목', body: '<div>크롤링 본문</div>' }],
      } as Partial<Source>),
    );

    await service.refresh(1, tx);

    expect(lastUpdate()).toEqual({
      titleKo: '크롤링 제목',
      titleEn: null,
      previewKo: '크롤링 본문',
      previewEn: null,
      plainBody: '크롤링 본문 크롤링 제목',
      langs: ['ko'],
      deadline: null,
    });
  });

  it('includes tags, keywords and summary in plainBody', async () => {
    repository.getSource.mockResolvedValue(
      buildSource({
        tags: [{ name: 'tag1' }],
        keywords: ['kw1', 'kw2'],
        summary: '요약',
      } as Partial<Source>),
    );

    await service.refresh(1, tx);

    expect(lastUpdate().plainBody).toMatch(/tag1 kw1 kw2 요약$/);
  });

  it('truncates the preview to 1000 characters', async () => {
    repository.getSource.mockResolvedValue(
      buildSource({
        contents: [
          { lang: 'ko', title: '제목', body: 'a'.repeat(1500), deadline: null },
        ],
      } as Partial<Source>),
    );

    await service.refresh(1, tx);

    expect(lastUpdate().previewKo).toHaveLength(1000);
  });
});
