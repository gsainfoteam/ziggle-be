import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Crawl } from '@prisma/client';
import { load } from 'cheerio';
import {
  catchError,
  concatMap,
  map,
  Observable,
  throwError,
  timeout,
} from 'rxjs';
import { CrawlerRepository } from './crawler.repository';
import { UserService } from './user/user.service';
import { Loggable } from '@lib/logger/decorator/loggable';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { CustomConfigService } from '@lib/custom-config';
import { htmlToText } from 'html-to-text';
import {
  CrawlerFcmService,
  FcmTargetUser,
} from './crawler-fcm/crawler-fcm.service';

@Loggable()
@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly targetUrl =
    'https://www.gist.ac.kr/kr/html/sub05/050209.html';
  constructor(
    @InjectQueue('fcm') private readonly fcmQueue: Queue,
    private readonly customConfigService: CustomConfigService,
    private readonly userService: UserService,
    private readonly httpService: HttpService,
    private readonly crawlerRepository: CrawlerRepository,
    private readonly crawlerFcmService: CrawlerFcmService,
  ) {}

  async checkCrawlData(url: string): Promise<Crawl | null> {
    return this.crawlerRepository.checkCrawlData(url);
  }

  private toPlainText(html?: string): string | undefined {
    if (!html) return undefined;
    return htmlToText(html, {
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    })
      .slice(0, 1000)
      .replace(/\s+/gm, ' ');
  }

  async createCrawl(
    data: Pick<Crawl, 'title' | 'body' | 'type' | 'crawledAt' | 'url'>,
    createdAt: Date,
    userName: string,
    deadline?: Date,
  ): Promise<Crawl> {
    const user = await this.userService.findOrCreateTempUser(userName);
    const created = await this.crawlerRepository.createCrawl(
      data,
      createdAt,
      user,
      deadline,
    );

    await this.crawlerFcmService.postMessageWithDelay(
      created.noticeId.toString(),
      {
        title: data.title,
        body: this.toPlainText(data.body),
      },
      FcmTargetUser.All,
      { path: `/crawl/${created.id}` },
    );

    return created;
  }

  async updateCrawl(
    data: Pick<Crawl, 'title' | 'body' | 'type'>,
    id: number,
  ): Promise<Crawl> {
    return this.crawlerRepository.updateCrawl(data, id);
  }

  getNoticeList(): Observable<{
    title: string;
    link: string;
    author: string;
    category: string;
    createdAt: string;
    id: number;
  }> {
    return this.httpService
      .get(this.targetUrl, {
        headers: {
          'User-Agent': '',
        },
      })
      .pipe(
        timeout(60e3),
        map((res) => load(res.data)),
        map(($) => $('table > tbody > tr')),
        concatMap(($) => $.toArray().map((value: any) => load(value))),
        map(($) => {
          return {
            title: $('td').eq(2).text().trim(),
            link: `${this.targetUrl}${$('td').eq(2).find('a').attr('href')}`,
            author: $('td').eq(3).text().trim(),
            category: $('td').eq(1).text().trim(),
            createdAt: $('td').eq(5).text().trim(),
          };
        }),
        map((meta) => ({
          id: Number.parseInt(meta.link.split('no=')[1].split('&')[0]),
          ...meta,
        })),
        catchError((err) => {
          this.logger.error(err);
          return throwError(() => new Error(err));
        }),
      );
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
}
