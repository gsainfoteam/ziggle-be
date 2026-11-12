import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Crawl, File } from '@generated/prisma/client';
import { load } from 'cheerio';
import {
  catchError,
  firstValueFrom,
  from,
  map,
  Observable,
  throwError,
  timeout,
} from 'rxjs';
import { CrawlerRepository } from './crawler.repository';
import { UserService } from './user/user.service';
import { Loggable } from '@lib/logger/decorator/loggable';
import { htmlToText } from 'html-to-text';
import {
  CrawlerFcmService,
  FcmTargetUser,
} from './crawler-fcm/crawler-fcm.service';
import { Notification } from 'firebase-admin/messaging';

interface NoticeMeta {
  title: string;
  link: string;
  author: string;
  category: string;
  createdAt: string;
  id: number;
}

@Loggable()
@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly targetUrl =
    'https://www.gist.ac.kr/kr/html/sub05/050209.html';
  private readonly minimumOrdinaryNotices = 50;
  private readonly knownOrdinaryStreakLimit = 10;
  constructor(
    private readonly userService: UserService,
    private readonly httpService: HttpService,
    private readonly crawlerRepository: CrawlerRepository,
    private readonly crawlerFcmService: CrawlerFcmService,
  ) {}

  async checkCrawlData(
    url: string,
  ): Promise<(Crawl & { notice: { files: File[] } }) | null> {
    return this.crawlerRepository.checkCrawlData(url);
  }

  async createCrawl(
    data: Pick<Crawl, 'title' | 'body' | 'type' | 'crawledAt' | 'url'>,
    createdAt: Date,
    userName: string,
    files: {
      href: string;
      name: string;
      type: 'doc' | 'hwp' | 'pdf' | 'imgs' | 'xls' | 'etc';
    }[],
  ): Promise<Crawl> {
    const user = await this.userService.findOrCreateTempUser(userName);
    const created = await this.crawlerRepository.createCrawl(
      data,
      createdAt,
      user,
      files,
    );

    await this.crawlerFcmService
      .postMessageWithDelay(
        created.noticeId.toString(),
        this.convertNotificationBodyToString({
          title: data.title,
          body: data.body ?? undefined,
        }),
        FcmTargetUser.All,
        { path: `/notice/${created.noticeId}` },
      )
      .catch((err) =>
        this.logger.error('FCM enqueue failed', err?.stack ?? String(err)),
      );

    return created;
  }

  async updateCrawl(
    data: Pick<Crawl, 'title' | 'body' | 'type'>,
    id: number,
    files: {
      href: string;
      name: string;
      type: 'doc' | 'hwp' | 'pdf' | 'imgs' | 'xls' | 'etc';
    }[],
  ): Promise<Crawl> {
    return this.crawlerRepository.updateCrawl(data, id, files);
  }

  getNoticeList(): Observable<NoticeMeta> {
    return from(this.iterateNoticeList());
  }

  private async *iterateNoticeList(): AsyncGenerator<NoticeMeta> {
    // History is determined only after the complete pinned section is known.
    let hasOrdinaryHistory: boolean | undefined;
    const pinnedUrls = new Set<string>();
    const seen = new Set<number>();
    const pageSignatures = new Set<string>();
    let ordinaryCount = 0;
    let knownOrdinaryStreak = 0;
    let pinnedSectionComplete = false;

    // A safety limit is an error, never a successful partial crawl.
    for (let page = 1; page <= 1000; page++) {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.targetUrl}?GotoPage=${page}`, {
            headers: { 'User-Agent': '' },
          })
          .pipe(timeout(60e3)),
      );
      const $ = load(response.data);
      const rows = $('table > tbody > tr').toArray();
      const notices = rows.flatMap((row) => {
        const cells = $(row).find('td');
        const href = cells.eq(2).find('a').attr('href');
        const no = href?.match(/[?&]no=(\d+)(?:&|$)/)?.[1];
        if (!no) {
          if (href || cells.length >= 6) {
            throw new Error(`Invalid notice link on page ${page}`);
          }
          return [];
        }
        const label = cells.eq(0).text().trim();
        if (label !== '공지' && !/^\d+$/.test(label)) {
          throw new Error(`Unknown notice row type on page ${page}`);
        }
        return [
          {
            id: Number(no),
            title: cells.eq(2).text().trim(),
            link: `${this.targetUrl}?mode=V&no=${no}&GotoPage=1`,
            author: cells.eq(3).text().trim(),
            category: cells.eq(1).text().trim(),
            createdAt: cells.eq(5).text().trim(),
            pinned: label === '공지',
          },
        ];
      });
      if (!notices.length) {
        throw new Error(`No notices parsed on page ${page}`);
      }
      const signature = notices.map(({ id }) => id).join(',');
      if (pageSignatures.has(signature)) {
        throw new Error(`Repeated notice page ${page}`);
      }
      pageSignatures.add(signature);
      // Pinned notices precede ordinary notices in the source board.
      // The first ordinary row marks the end of the pinned section.
      pinnedSectionComplete ||= notices.some(({ pinned }) => !pinned);

      for (const notice of notices) {
        if (notice.pinned) pinnedUrls.add(notice.link);
      }
      if (pinnedSectionComplete && hasOrdinaryHistory === undefined) {
        hasOrdinaryHistory = await this.crawlerRepository.hasOrdinaryCrawls(
          this.targetUrl,
          [...pinnedUrls],
        );
      }

      for (const { pinned, ...notice } of notices) {
        if (seen.has(notice.id)) continue;
        seen.add(notice.id);
        if (!pinned && !pinnedUrls.has(notice.link)) {
          ordinaryCount++;
          // The row is ordinary and its URL is outside the pinned URL set,
          // matching the scope used by hasOrdinaryCrawls.
          const known =
            hasOrdinaryHistory && (await this.checkCrawlData(notice.link));
          knownOrdinaryStreak = known ? knownOrdinaryStreak + 1 : 0;
        }
        yield notice;
      }

      // Finish the current page before stopping. New ordinary notices reset the
      // streak, so a burst larger than the minimum window is still collected.
      if (
        pinnedSectionComplete &&
        ordinaryCount >= this.minimumOrdinaryNotices &&
        (!hasOrdinaryHistory ||
          knownOrdinaryStreak >= this.knownOrdinaryStreakLimit)
      ) {
        return;
      }

      const pagination = $('.pg_num');
      if (!pagination.length) {
        throw new Error(`Missing pagination on page ${page}`);
      }
      const hasNext = pagination
        .find('a[href]')
        .toArray()
        .some((anchor) => {
          const href = $(anchor).attr('href') ?? '';
          const next = href.match(/[?&]GotoPage=(\d+)/)?.[1];
          return next !== undefined && Number(next) > page;
        });
      if (!hasNext) {
        if (ordinaryCount === 0) {
          throw new Error('Reached the last page without any ordinary notices');
        }
        return;
      }
    }
    throw new Error('Notice pagination exceeded 1000 pages');
  }

  getNoticeDetail(link: string): Observable<{
    content: string | undefined;
    files: {
      href: string;
      name: string;
      type: 'doc' | 'hwp' | 'pdf' | 'imgs' | 'xls' | 'etc';
    }[];
  }> {
    return this.httpService
      .get(link, {
        headers: {
          'User-Agent': '',
        },
      })
      .pipe(
        timeout(60e3),
        map((res) => load(res.data)),
        map(($) => ({
          content: $('.bd_detail_content').html()?.trim(),
          files: $('.bd_detail_file > ul > li > a')
            .toArray()
            .map((value: any) => ({
              href: `${this.targetUrl}${$(value).attr('href')}`,
              name: $(value).text().trim(),
              type: $(value).attr('class') as
                | 'doc'
                | 'hwp'
                | 'pdf'
                | 'imgs'
                | 'xls'
                | 'etc',
            })),
        })),
        catchError((err) => {
          this.logger.error(err);
          return throwError(() => new Error(err));
        }),
      );
  }

  private convertNotificationBodyToString(notification: Notification) {
    return {
      ...notification,
      body: notification.body
        ? htmlToText(notification.body, {
            selectors: [
              { selector: 'a', options: { ignoreHref: true } },
              { selector: 'img', format: 'skip' },
            ],
          })
            .slice(0, 1000)
            .replaceAll(/\s+/gm, ' ')
        : undefined,
    };
  }
}
