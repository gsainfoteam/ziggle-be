import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Crawl } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CrawlController } from 'src/crawl/crawl.controller';
import { CrawlService } from 'src/crawl/crawl.service';
import { GetCrawlDto } from 'src/crawl/dto/req/getCrawl.dto';
import { CreateCrawlDto } from 'src/crawl/dto/req/createCrawl.dto';

describe('CrawlController Integration Test', () => {
  let app: INestApplication;
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

    app = module.createNestApplication();
    crawlService = module.get(CrawlService);
    await app.init();
  });

  const getCrawlDto: GetCrawlDto = {
    url: 'https://ziggle.gistory.me',
    password: '12345678',
  };

  const createCrawlDto: CreateCrawlDto = {
    title: 'crawl title',
    body: 'crawl body',
    type: 'ACADEMIC',
    url: 'https://ziggle.gistory.me',
    createdAt: new Date(),
    authorName: 'author',
    password: '12345678',
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

  describe('getCrawlData', () => {
    it('should return crawl data', async () => {
      crawlService.getCrawlData.mockResolvedValue(crawlResult);

      const result = await request(app.getHttpServer())
        .get('/crawl')
        .query(getCrawlDto)
        .send();

      expect(result.status).toBe(200);
      expect(result.body).toEqual({
        ...crawlResult,
        crawledAt: crawlResult.crawledAt.toISOString(),
      });
    });

    it('should 400 error when query is not provided', async () => {
      const result = await request(app.getHttpServer()).get('/crawl').send();

      expect(result.status).toBe(400);
    });

    it('should 400 error when query type is invalid', async () => {
      // url만 쿼리로 넘어가는 경우
      const { url } = getCrawlDto;

      const result = await request(app.getHttpServer())
        .get('/crawl')
        .query(url)
        .send();
      expect(result.status).toBe(400);
    });

    it('should 500 error when service throw error', async () => {
      crawlService.getCrawlData.mockRejectedValue(new Error());

      const result = await request(app.getHttpServer())
        .get('/crawl')
        .query(getCrawlDto)
        .send();

      expect(result.status).toBe(500);
    });
  });

  describe('createCrawl', () => {
    it('should 400 error when body is not provided', async () => {
      const result = await request(app.getHttpServer()).post('/crawl').send();

      expect(result.status).toBe(400);
    });

    it('should 400 error when body type is invalid', async () => {
      // url만 body로 넘어가는 경우
      const { url } = createCrawlDto;

      const result = await request(app.getHttpServer())
        .post('/crawl')
        .send({ url });
      expect(result.status).toBe(400);
    });

    it('should 500 error when service throw error', async () => {
      crawlService.createCrawl.mockRejectedValue(new Error());

      const result = await request(app.getHttpServer())
        .post('/crawl')
        .send(createCrawlDto);

      expect(result.status).toBe(500);
    });
  });

  describe('updateCrawl', () => {
    it('should 400 error when body is not provided', async () => {
      const result = await request(app.getHttpServer()).patch('/crawl').send();

      expect(result.status).toBe(400);
    });

    it('should 400 error when body type is invalid', async () => {
      // url만 body로 넘어가는 경우
      const { url } = createCrawlDto;

      const result = await request(app.getHttpServer())
        .patch('/crawl')
        .send({ url });
      expect(result.status).toBe(400);
    });

    it('should 500 error when service throw error', async () => {
      crawlService.updateCrawl.mockRejectedValue(new Error());

      const result = await request(app.getHttpServer())
        .patch('/crawl')
        .send(createCrawlDto);

      expect(result.status).toBe(500);
    });
  });
});
