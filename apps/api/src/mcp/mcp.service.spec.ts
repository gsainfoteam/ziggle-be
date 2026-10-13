import { NotFoundException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '@lib/prisma';
import { McpService } from './mcp.service';

describe('McpService', () => {
  let service: McpService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    service = new McpService(prisma);
  });

  describe('searchNotices', () => {
    it('searches plainBody and falls back to english or empty title', async () => {
      prisma.notice.findMany.mockResolvedValue([
        { id: 1, titleKo: '한국어', titleEn: 'English', summary: '요약' },
        { id: 2, titleKo: '', titleEn: 'English', summary: null },
        { id: 3, titleKo: '', titleEn: null, summary: null },
      ] as never);

      const result = await service.searchNotices('장학', 5);

      expect(prisma.notice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            plainBody: { contains: '장학', mode: 'insensitive' },
          },
          take: 5,
        }),
      );
      expect(result).toEqual([
        { id: 1, title: '한국어', summary: '요약' },
        { id: 2, title: 'English', summary: null },
        { id: 3, title: '', summary: null },
      ]);
    });
  });

  describe('getNoticeBody', () => {
    const mockNotice = (notice: unknown) =>
      prisma.notice.findUnique.mockResolvedValue(notice as never);

    it('prefers the crawled body', async () => {
      mockNotice({
        crawls: [{ body: 'crawl' }],
        contents: [{ lang: 'ko', body: 'ko' }],
      });

      await expect(service.getNoticeBody(1)).resolves.toEqual({
        id: 1,
        body: 'crawl',
      });
    });

    it('uses the korean content over others', async () => {
      mockNotice({
        crawls: [],
        contents: [
          { lang: 'en', body: 'en' },
          { lang: 'ko', body: 'ko' },
        ],
      });

      await expect(service.getNoticeBody(1)).resolves.toEqual({
        id: 1,
        body: 'ko',
      });
    });

    it('falls back to the first content', async () => {
      mockNotice({ crawls: [], contents: [{ lang: 'en', body: 'en' }] });

      await expect(service.getNoticeBody(1)).resolves.toEqual({
        id: 1,
        body: 'en',
      });
    });

    it('throws NotFound for a missing notice', async () => {
      mockNotice(null);

      await expect(service.getNoticeBody(1)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFound when the notice has no body', async () => {
      mockNotice({ crawls: [], contents: [] });

      await expect(service.getNoticeBody(1)).rejects.toThrow('has no body');
    });
  });
});
