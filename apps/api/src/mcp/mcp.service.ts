import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@lib/prisma';

@Injectable()
export class McpService {
  constructor(private readonly prismaService: PrismaService) {}

  async searchNotices(query: string, limit = 10) {
    const notices = await this.prismaService.notice.findMany({
      where: {
        deletedAt: null,
        plainBody: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        titleKo: true,
        titleEn: true,
        summary: true,
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    return notices.map(({ id, titleKo, titleEn, summary }) => ({
      id,
      title: titleKo || titleEn || '',
      summary,
    }));
  }

  async getNoticeBody(id: number): Promise<{ id: number; body: string }> {
    const notice = await this.prismaService.notice.findUnique({
      where: { id, deletedAt: null },
      select: {
        crawls: {
          select: { body: true },
          orderBy: { id: 'asc' },
          take: 1,
        },
        contents: {
          select: { lang: true, body: true },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException(`Notice with id ${id} not found`);
    }

    const koreanContent = notice.contents.find(({ lang }) => lang === 'ko');
    const body =
      notice.crawls[0]?.body ?? koreanContent?.body ?? notice.contents[0]?.body;

    if (body === undefined) {
      throw new NotFoundException(`Notice with id ${id} has no body`);
    }

    return { id, body };
  }
}
