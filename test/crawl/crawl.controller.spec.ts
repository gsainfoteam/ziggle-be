import { Test, TestingModule } from '@nestjs/testing';
import { Crawl } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CrawlController } from 'src/crawl/crawl.controller';
import { CrawlService } from 'src/crawl/crawl.service';
import { CreateCrawlDto } from 'src/crawl/dto/req/createCrawl.dto';

describe('CrawlController', () => {
  let crawlController: CrawlController;
  let crawlService: DeepMockProxy<CrawlService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlController],
      providers: [
        {
          provide: CrawlService,
          useValue: mockDeep<CrawlService>(),
        },
      ],
    }).compile();

    crawlController = module.get<CrawlController>(CrawlController);
    crawlService = module.get(CrawlService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(crawlController).toBeDefined();
    expect(crawlService).toBeDefined();
  });

  const inputCrawlDto: CreateCrawlDto = {
    title: 'crawl title',
    body: 'crawl body',
    type: 'ACADEMIC',
    url: 'https://ziggle.gistory.me',
    createdAt: new Date(),
    authorName: 'author',
    password: 'test password',
  };

  const crawlResult: Crawl = {
    id: 1,
    title: 'title',
    body: 'body',
    type: 'ACADEMIC',
    url: 'https://ziggle.gistory.me',
    crawledAt: new Date(),
    noticeId: 1,
  };

  describe('about getCrawlData', () => {
    it('should return crawl data', async () => {
      crawlService.getCrawlData.mockResolvedValue(crawlResult);

      expect(await crawlController.getCrawlData(inputCrawlDto)).toEqual(
        crawlResult,
      );
    });

    it('should throw error when crawlService.getCrawlData throw error', async () => {
      crawlService.getCrawlData.mockRejectedValue(new Error());

      await expect(crawlController.getCrawlData(inputCrawlDto)).rejects.toThrow(
        Error,
      );
    });
  });

  describe('about createCrawl', () => {
    it('should call crawlService.createCrawl', async () => {
      await crawlController.createCrawl(inputCrawlDto);

      expect(crawlService.createCrawl).toHaveBeenCalledWith(inputCrawlDto);
    });

    it('should throw error when crawlService.createCrawl throw error', async () => {
      crawlService.createCrawl.mockRejectedValue(new Error());

      await expect(crawlController.createCrawl(inputCrawlDto)).rejects.toThrow(
        Error,
      );
    });
  });

  describe('about updateCrawl', () => {
    it('should call crawlService.updateCrawl', async () => {
      await crawlController.updateCrawl(inputCrawlDto);

      expect(crawlService.updateCrawl).toHaveBeenCalledWith(inputCrawlDto);
    });

    it('should throw error when crawlService.updateCrawl throw error', async () => {
      crawlService.updateCrawl.mockRejectedValue(new Error());

      await expect(crawlController.updateCrawl(inputCrawlDto)).rejects.toThrow(
        Error,
      );
    });
  });
});
