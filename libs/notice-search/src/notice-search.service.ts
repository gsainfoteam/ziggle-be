import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma/client';
import { Loggable } from '@lib/logger/decorator/loggable';
import { NoticeSearchRepository } from './notice-search.repository';
import { extractPlainText } from './plain-text';

const PREVIEW_LENGTH = 1000;

interface LocalizedNotice {
  title: string | null;
  preview: string;
  deadline: Date | null;
}

@Injectable()
@Loggable()
export class NoticeSearchService {
  constructor(
    private readonly noticeSearchRepository: NoticeSearchRepository,
  ) {}

  async refresh(noticeId: number, tx: Prisma.TransactionClient): Promise<void> {
    const { contents, crawls, tags } =
      await this.noticeSearchRepository.getSource(noticeId, tx);

    const sources =
      crawls.length > 0
        ? crawls.map(({ title, body }) => ({
            lang: 'ko',
            title,
            body,
            deadline: null,
          }))
        : contents;

    const byLang = new Map<string, LocalizedNotice>();
    const plainBodies: string[] = [];

    for (const { lang, title, body, deadline } of sources) {
      const plain = extractPlainText(body).trim();
      plainBodies.push(plain);

      if (!byLang.has(lang)) {
        byLang.set(lang, {
          title,
          preview: plain.slice(0, PREVIEW_LENGTH),
          deadline,
        });
      }
    }

    const ko = byLang.get('ko');
    const en = byLang.get('en');

    await this.noticeSearchRepository.updateSearchFields(
      noticeId,
      {
        titleKo: ko?.title ?? '',
        titleEn: en?.title ?? null,
        previewKo: ko?.preview ?? '',
        previewEn: en?.preview ?? null,
        plainBody: [
          ...plainBodies,
          ...sources.map(({ title }) => title ?? ''),
          ...tags.map(({ name }) => name),
        ]
          .join(' ')
          .trim(),
        langs: [...byLang.keys()],
        deadline: ko?.deadline ?? null,
      },
      tx,
    );
  }
}
