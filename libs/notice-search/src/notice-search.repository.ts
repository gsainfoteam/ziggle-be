import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma/client';

@Injectable()
export class NoticeSearchRepository {
  async getSource(noticeId: number, tx: Prisma.TransactionClient) {
    return tx.notice.findUniqueOrThrow({
      where: { id: noticeId },
      select: {
        contents: {
          select: { lang: true, title: true, body: true, deadline: true },
          orderBy: { id: 'asc' },
        },
        crawls: {
          select: { title: true, body: true },
          orderBy: { id: 'asc' },
        },
        tags: { select: { name: true } },
      },
    });
  }

  async updateSearchFields(
    noticeId: number,
    data: Prisma.NoticeUpdateInput,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.notice.update({ where: { id: noticeId }, data });
  }
}
