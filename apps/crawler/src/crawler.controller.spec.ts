import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';

describe('CrawlerController', () => {
  let crawlerController: CrawlerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CrawlerController],
      providers: [CrawlerService],
    }).compile();

    crawlerController = app.get<CrawlerController>(CrawlerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(crawlerController.getHello()).toBe('Hello World!');
    });
  });
});
