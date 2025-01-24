import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
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

@Loggable()
@Injectable()
export class CrawlerService {
  private readonly targetUrl =
    'https://www.gist.ac.kr/kr/html/sub05/050209.html';
  constructor(
    private readonly userService: UserService,
    private readonly httpService: HttpService,
    private readonly crawlerRepository: CrawlerRepository,
  ) {}

  async checkCrawlData(url: string): Promise<Crawl | null> {
    return this.crawlerRepository.checkCrawlData(url);
  }

  async createCrawl(
    data: Pick<Crawl, 'title' | 'body' | 'type' | 'crawledAt' | 'url'>,
    createdAt: Date,
    userName: string,
    deadline?: Date,
  ): Promise<Crawl> {
    const user = await this.userService.findOrCreateTempUser(userName);
    return this.crawlerRepository.createCrawl(data, createdAt, user, deadline);
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
    return this.httpService.get(this.targetUrl).pipe(
      timeout(10 * 1000),
      catchError(throwError),
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
    return this.httpService.get(link).pipe(
      timeout(10 * 1000),
      map((res) => load(res.data)),
      catchError(throwError),
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
    );
  }
}
