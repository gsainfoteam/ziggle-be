import { Test, TestingModule } from '@nestjs/testing';
import { CrawlRepository } from '../../src/crawl/crawl.repository';
import { CreateCrawlDto } from '../../src/crawl/dto/req/createCrawl.dto';
import { ConfigService } from '@nestjs/config';
import { Crawl } from '@prisma/client';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

describe('CrawlRepository', () => {
  let repository: CrawlRepository;
  let prisma: PrismaService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlRepository, PrismaService, ConfigService],
    }).compile();

    repository = module.get<CrawlRepository>(CrawlRepository);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
    expect(prisma).toBeDefined();
    expect(config).toBeDefined();
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

  it('should create a crawl', async () => {
    const createSpy = jest
      .spyOn(prisma.crawl, 'create')
      .mockResolvedValue(crawlResult);

    expect(await repository.createCrawl(inputCrawlDto, deadline, user)).toEqual(
      crawlResult,
    );

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
    const prismaError = new PrismaClientKnownRequestError('Test Prisma error', {
      code: 'P2002',
      clientVersion: '5.12.1',
    });

    const createSpyForPrismaError = jest
      .spyOn(prisma.crawl, 'create')
      .mockRejectedValue(prismaError);

    await expect(
      repository.createCrawl(inputCrawlDto, deadline, user),
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
      .spyOn(prisma.crawl, 'create')
      .mockRejectedValue(new Error('Test general error'));

    await expect(
      repository.createCrawl(inputCrawlDto, deadline, user),
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

  it('should return crawl', async () => {
    const findFirstSpy = jest
      .spyOn(prisma.crawl, 'findFirst')
      .mockResolvedValue(crawlResult);

    expect(await repository.getCrawlData(inputCrawlDto)).toEqual(crawlResult);
    expect(findFirstSpy).toHaveBeenCalledWith({
      where: {
        url: inputCrawlDto.url,
      },
    });
  });

  it('should throw Prisma Exception for return a crawl', async () => {
    const prismaError = new PrismaClientKnownRequestError('Test Prisma error', {
      code: 'P2002',
      clientVersion: '5.12.1',
    });

    const findFirstSpyForPrismaError = jest
      .spyOn(prisma.crawl, 'findFirst')
      .mockRejectedValue(prismaError);

    await expect(repository.getCrawlData(inputCrawlDto)).rejects.toThrow(
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
      .spyOn(prisma.crawl, 'findFirst')
      .mockRejectedValue(new Error('Test general error'));

    await expect(repository.getCrawlData(inputCrawlDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(createSpyForGeneralError).toHaveBeenCalledWith({
      where: {
        url: inputCrawlDto.url,
      },
    });
  });

  it('should update a crawl', async () => {
    const updateSpy = jest
      .spyOn(prisma.crawl, 'update')
      .mockResolvedValue(crawlResult);

    expect(await repository.updateCrawl(inputCrawlDto, 1)).toEqual(crawlResult);
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
    const prismaError = new PrismaClientKnownRequestError('Test Prisma error', {
      code: 'P2002',
      clientVersion: '5.12.1',
    });

    const updateSpyForPrismaError = jest
      .spyOn(prisma.crawl, 'update')
      .mockRejectedValue(prismaError);

    await expect(repository.updateCrawl(inputCrawlDto, 1)).rejects.toThrow(
      InternalServerErrorException,
    );
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
      .spyOn(prisma.crawl, 'update')
      .mockRejectedValue(new Error('Test general error'));

    await expect(repository.updateCrawl(inputCrawlDto, 1)).rejects.toThrow(
      InternalServerErrorException,
    );
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
