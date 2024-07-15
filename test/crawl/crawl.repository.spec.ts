import { Test, TestingModule } from '@nestjs/testing';
import { CrawlRepository } from '../../src/crawl/crawl.repository';
import { CreateCrawlDto } from '../../src/crawl/dto/req/createCrawl.dto';
import { ConfigService } from '@nestjs/config';
import { Crawl } from '@prisma/client';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('CrawlRepository', () => {
  let crawlRepository: CrawlRepository;
  let prismaService: DeepMockProxy<PrismaService>;
  let configService: DeepMockProxy<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlRepository,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: ConfigService,
          useValue: mockDeep<ConfigService>(),
        },
      ],
    }).compile();

    crawlRepository = module.get<CrawlRepository>(CrawlRepository);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(crawlRepository).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(configService).toBeDefined();
  });

  // get, create, update 함수에서 공통으로 쓰이는 input dto
  const inputCrawlDto: CreateCrawlDto = {
    title: 'crawl title',
    body: 'crawl body',
    type: 'ACADEMIC',
    url: 'https://ziggle.gistory.me',
    createdAt: new Date(),
    authorName: 'author',
    password: '12345678',
  };

  // create 함수에서만 쓰이는 input parameters(deadline, user)
  const deadline = null;
  const user = {
    uuid: 'b8f00000-1111-2222-9ec7-12189c137aff',
    name: 'user',
    createdAt: new Date(),
    consent: false,
  };

  // get, create, update 함수에서 공통적으로 return하는 데이터
  const crawlResult: Crawl = {
    id: 1,
    title: 'title',
    body: 'body',
    type: 'ACADEMIC',
    url: 'https://ziggle.gistory.me',
    crawledAt: new Date(),
    noticeId: 1,
  };

  describe('about createCrawl', () => {
    it('should create a crawl', async () => {
      const createSpy = jest
        .spyOn(prismaService.crawl, 'create')
        .mockResolvedValue(crawlResult);

      expect(
        await crawlRepository.createCrawl(inputCrawlDto, deadline, user),
      ).toEqual(crawlResult);

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          title: inputCrawlDto.title,
          body: inputCrawlDto.body,
          type: inputCrawlDto.type,
          url: inputCrawlDto.url,
          crawledAt: inputCrawlDto.createdAt,
          notice: {
            create: {
              category: 'ACADEMIC',
              currentDeadline: deadline,
              author: {
                connect: user,
              },
            },
          },
        },
      });
    });

    it('should throw Prisma Exception for create a crawl', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Test Prisma error',
        {
          code: 'P2002',
          clientVersion: '5.12.1',
        },
      );

      const createSpyForPrismaError = jest
        .spyOn(prismaService.crawl, 'create')
        .mockRejectedValue(prismaError);

      await expect(
        crawlRepository.createCrawl(inputCrawlDto, deadline, user),
      ).rejects.toThrow(InternalServerErrorException);
      expect(createSpyForPrismaError).toHaveBeenCalledWith({
        data: {
          title: inputCrawlDto.title,
          body: inputCrawlDto.body,
          type: inputCrawlDto.type,
          url: inputCrawlDto.url,
          crawledAt: inputCrawlDto.createdAt,
          notice: {
            create: {
              category: 'ACADEMIC',
              currentDeadline: deadline,
              author: {
                connect: user,
              },
            },
          },
        },
      });
    });

    it('should throw General Exception for create a crawl', async () => {
      const createSpyForGeneralError = jest
        .spyOn(prismaService.crawl, 'create')
        .mockRejectedValue(new Error('Test general error'));

      await expect(
        crawlRepository.createCrawl(inputCrawlDto, deadline, user),
      ).rejects.toThrow(InternalServerErrorException);
      expect(createSpyForGeneralError).toHaveBeenCalledWith({
        data: {
          title: inputCrawlDto.title,
          body: inputCrawlDto.body,
          type: inputCrawlDto.type,
          url: inputCrawlDto.url,
          crawledAt: inputCrawlDto.createdAt,
          notice: {
            create: {
              category: 'ACADEMIC',
              currentDeadline: deadline,
              author: {
                connect: user,
              },
            },
          },
        },
      });
    });
  });

  describe('about getCrawlData', () => {
    it('should return crawl', async () => {
      const findFirstSpy = jest
        .spyOn(prismaService.crawl, 'findFirst')
        .mockResolvedValue(crawlResult);

      expect(await crawlRepository.getCrawlData(inputCrawlDto)).toEqual(
        crawlResult,
      );
      expect(findFirstSpy).toHaveBeenCalledWith({
        where: {
          url: inputCrawlDto.url,
        },
      });
    });

    it('should throw Prisma Exception for return a crawl', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Test Prisma error',
        {
          code: 'P2002',
          clientVersion: '5.12.1',
        },
      );

      const findFirstSpyForPrismaError = jest
        .spyOn(prismaService.crawl, 'findFirst')
        .mockRejectedValue(prismaError);

      await expect(crawlRepository.getCrawlData(inputCrawlDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(findFirstSpyForPrismaError).toHaveBeenCalledWith({
        where: {
          url: inputCrawlDto.url,
        },
      });
    });

    it('should throw General Exception for return a crawl', async () => {
      const createSpyForGeneralError = jest
        .spyOn(prismaService.crawl, 'findFirst')
        .mockRejectedValue(new Error('Test general error'));

      await expect(crawlRepository.getCrawlData(inputCrawlDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(createSpyForGeneralError).toHaveBeenCalledWith({
        where: {
          url: inputCrawlDto.url,
        },
      });
    });
  });

  describe('about updateCrawl', () => {
    it('should update a crawl', async () => {
      const updateSpy = jest
        .spyOn(prismaService.crawl, 'update')
        .mockResolvedValue(crawlResult);

      expect(await crawlRepository.updateCrawl(inputCrawlDto, 1)).toEqual(
        crawlResult,
      );
      expect(updateSpy).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          title: inputCrawlDto.title,
          body: inputCrawlDto.body,
          type: inputCrawlDto.type,
        },
      });
    });

    it('should throw Prisma Exception for update a crawl', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Test Prisma error',
        {
          code: 'P2002',
          clientVersion: '5.12.1',
        },
      );

      const updateSpyForPrismaError = jest
        .spyOn(prismaService.crawl, 'update')
        .mockRejectedValue(prismaError);

      await expect(
        crawlRepository.updateCrawl(inputCrawlDto, 1),
      ).rejects.toThrow(InternalServerErrorException);
      expect(updateSpyForPrismaError).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          title: inputCrawlDto.title,
          body: inputCrawlDto.body,
          type: inputCrawlDto.type,
        },
      });
    });

    it('should throw General Exception for update a crawl', async () => {
      const updateSpyForGeneralError = jest
        .spyOn(prismaService.crawl, 'update')
        .mockRejectedValue(new Error('Test general error'));

      await expect(
        crawlRepository.updateCrawl(inputCrawlDto, 1),
      ).rejects.toThrow(InternalServerErrorException);
      expect(updateSpyForGeneralError).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          title: inputCrawlDto.title,
          body: inputCrawlDto.body,
          type: inputCrawlDto.type,
        },
      });
    });
  });
});
