import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Crawl, User } from '@prisma/client';
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

@Injectable()
export class CrawlerService {
  private readonly targetUrl =
    'https://www.gist.ac.kr/kr/html/sub05/050209.html';
  constructor(
    private readonly httpService: HttpService,
    private readonly crawlerRepository: CrawlerRepository,
  ) {}

  async checkCrawlData(urls: string[]): Promise<Crawl[]> {
    return this.crawlerRepository.checkCrawlData(urls);
  }

  async createCrawl(
    data: Pick<Crawl, 'title' | 'body' | 'type' | 'crawledAt' | 'url'>,
    user: User,
    deadline?: Date,
  ): Promise<Crawl> {
    return this.crawlerRepository.createCrawl(data, user, deadline);
  }

  async updateCrawl(
    data: Pick<Crawl, 'title' | 'body' | 'type'>,
    id: number,
  ): Promise<Crawl> {
    return this.crawlerRepository.updateCrawl(data, id);
  }

  getNoticeList(): Observable<any> {
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

  getNoticeDetail(link: string) {
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
