import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { mock, MockProxy } from 'jest-mock-extended';
import { firstValueFrom, of, throwError, toArray } from 'rxjs';
import { Crawl, CrawlType, User } from '@generated/prisma/client';
import {
  CrawlerFcmService,
  FcmTargetUser,
} from './crawler-fcm/crawler-fcm.service';
import { CrawlerRepository } from './crawler.repository';
import { CrawlerService } from './crawler.service';
import { UserService } from './user/user.service';

const TARGET_URL = 'https://www.gist.ac.kr/kr/html/sub05/050209.html';

const listRow = (no: string, title: string) => `
  <tr>
    <td>1</td>
    <td>학사</td>
    <td><a href="?mode=V&no=${no}&GotoPage=1">${title}</a></td>
    <td>학사팀</td>
    <td>10</td>
    <td>2026-01-01</td>
  </tr>`;

const listPage = (rows: string) =>
  `<html><body><table><tbody>${rows}</tbody></table></body></html>`;

const response = (data: string) => of({ data } as AxiosResponse<string>);

describe('CrawlerService', () => {
  let service: CrawlerService;
  let userService: MockProxy<UserService>;
  let httpService: MockProxy<HttpService>;
  let crawlerRepository: MockProxy<CrawlerRepository>;
  let crawlerFcmService: MockProxy<CrawlerFcmService>;

  beforeEach(() => {
    userService = mock<UserService>();
    httpService = mock<HttpService>();
    crawlerRepository = mock<CrawlerRepository>();
    crawlerFcmService = mock<CrawlerFcmService>();
    crawlerFcmService.postMessageWithDelay.mockResolvedValue(
      undefined as never,
    );

    service = new CrawlerService(
      userService,
      httpService,
      crawlerRepository,
      crawlerFcmService,
    );
  });

  describe('getNoticeList', () => {
    it('parses notices from the first two pages', async () => {
      httpService.get
        .mockReturnValueOnce(response(listPage(listRow('100', '공지 1'))))
        .mockReturnValueOnce(response(listPage(listRow('99', '공지 2'))));

      const notices = await firstValueFrom(
        service.getNoticeList().pipe(toArray()),
      );

      expect(httpService.get).toHaveBeenNthCalledWith(
        1,
        TARGET_URL,
        expect.anything(),
      );
      expect(httpService.get).toHaveBeenNthCalledWith(
        2,
        `${TARGET_URL}?&GotoPage=2`,
        expect.anything(),
      );
      expect(notices).toEqual([
        {
          id: 100,
          title: '공지 1',
          link: `${TARGET_URL}?mode=V&no=100&GotoPage=1`,
          author: '학사팀',
          category: '학사',
          createdAt: '2026-01-01',
        },
        expect.objectContaining({ id: 99, title: '공지 2' }),
      ]);
    });

    it('skips rows without a notice number', async () => {
      const rowWithoutLink = '<tr><td></td><td></td><td>empty</td></tr>';
      httpService.get.mockReturnValue(
        response(listPage(rowWithoutLink + listRow('100', '공지'))),
      );

      const notices = await firstValueFrom(
        service.getNoticeList().pipe(toArray()),
      );

      expect(notices.map(({ id }) => id)).toEqual([100, 100]);
    });

    it('propagates http errors', async () => {
      httpService.get.mockReturnValue(throwError(() => 'network error'));

      await expect(
        firstValueFrom(service.getNoticeList().pipe(toArray())),
      ).rejects.toThrow('network error');
    });
  });

  describe('getNoticeDetail', () => {
    it('parses content and attached files', async () => {
      httpService.get.mockReturnValue(
        response(`
          <div class="bd_detail_content"> <p>본문</p> </div>
          <div class="bd_detail_file">
            <ul>
              <li><a class="pdf" href="?download=1">안내문.pdf</a></li>
              <li><a class="hwp" href="?download=2">신청서.hwp</a></li>
            </ul>
          </div>`),
      );

      const detail = await firstValueFrom(service.getNoticeDetail('link'));

      expect(detail).toEqual({
        content: '<p>본문</p>',
        files: [
          {
            href: `${TARGET_URL}?download=1`,
            name: '안내문.pdf',
            type: 'pdf',
          },
          {
            href: `${TARGET_URL}?download=2`,
            name: '신청서.hwp',
            type: 'hwp',
          },
        ],
      });
    });
  });

  describe('createCrawl', () => {
    const data = {
      title: '공지',
      body: '<p>공지 <a href="https://ziggle.gistory.me">본문</a></p><img src="a.png">',
      type: CrawlType.ACADEMIC,
      crawledAt: new Date(),
      url: 'https://gist.ac.kr/notice/1',
    };

    beforeEach(() => {
      userService.findOrCreateTempUser.mockResolvedValue({
        uuid: 'temp-user',
      } as User);
      crawlerRepository.createCrawl.mockResolvedValue({
        id: 1,
        noticeId: 10,
      } as Crawl);
    });

    it('creates a crawl with a temp user and schedules FCM', async () => {
      const created = await service.createCrawl(data, new Date(), '학사팀', []);

      expect(userService.findOrCreateTempUser).toHaveBeenCalledWith('학사팀');
      expect(created.noticeId).toBe(10);
      expect(crawlerFcmService.postMessageWithDelay).toHaveBeenCalledWith(
        '10',
        { title: '공지', body: '공지 본문' },
        FcmTargetUser.All,
        { path: '/notice/10' },
      );
    });

    it('still returns the crawl when FCM enqueue fails', async () => {
      crawlerFcmService.postMessageWithDelay.mockRejectedValue(
        new Error('redis down'),
      );

      await expect(
        service.createCrawl(data, new Date(), '학사팀', []),
      ).resolves.toEqual({ id: 1, noticeId: 10 });
    });
  });
});
