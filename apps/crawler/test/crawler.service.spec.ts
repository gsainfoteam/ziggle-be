import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from '../src/crawler.service';
import { HttpModule } from '@nestjs/axios';
import { firstValueFrom, toArray } from 'rxjs';

describe('CrawlerService', () => {
  let crawlerService: CrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [CrawlerService],
    }).compile();

    crawlerService = module.get(CrawlerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(crawlerService).toBeDefined();
  });

  describe('getNoticeList', () => {
    it('should return notice list', async () => {
      const noticeList = await firstValueFrom(
        crawlerService.getNoticeList().pipe(toArray()),
      );
      expect(noticeList.length).toBeGreaterThan(0);
      console.log(noticeList);
      console.log('noticeList.length:', noticeList.length);
    });
  });

  describe('getNoticeDetail', () => {
    it('should return notice detail', async () => {
      const noticeList = await firstValueFrom(
        crawlerService.getNoticeList().pipe(toArray()),
      );
      const noticeDetail = await firstValueFrom(
        crawlerService.getNoticeDetail(noticeList[0].link),
      );
      expect(noticeDetail).toBeDefined();
      console.log(noticeDetail);
    });
  });
});
