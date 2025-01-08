import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from '../src/crawler.service';
import { HttpModule } from '@nestjs/axios';

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
});
