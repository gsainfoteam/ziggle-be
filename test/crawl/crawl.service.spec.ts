import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Crawl, User } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AiService } from 'src/ai/ai.service';
import { CrawlRepository } from 'src/crawl/crawl.repository';
import { CrawlService } from 'src/crawl/crawl.service';
import { CreateCrawlDto } from 'src/crawl/dto/req/createCrawl.dto';
import { GetCrawlDto } from 'src/crawl/dto/req/getCrawl.dto';
import { UserService } from 'src/user/user.service';

describe('CrawlService', () => {
  let crawlService: CrawlService;
  let configService: DeepMockProxy<ConfigService>;
  let userService: DeepMockProxy<UserService>;
  let aiService: DeepMockProxy<AiService>;
  let crawlRepository: DeepMockProxy<CrawlRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlService,
        {
          provide: ConfigService,
          useValue: mockDeep<ConfigService>(),
        },
        {
          provide: UserService,
          useValue: mockDeep<UserService>(),
        },
        {
          provide: AiService,
          useValue: mockDeep<AiService>(),
        },
        {
          provide: AiService,
          useValue: mockDeep<AiService>(),
        },
        {
          provide: CrawlRepository,
          useValue: mockDeep<CrawlRepository>(),
        },
      ],
    }).compile();

    crawlService = module.get(CrawlService);
    configService = module.get(ConfigService);
    userService = module.get(UserService);
    aiService = module.get(AiService);
    crawlRepository = module.get(CrawlRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(crawlService).toBeDefined();
    expect(configService).toBeDefined();
    expect(userService).toBeDefined();
    expect(aiService).toBeDefined();
    expect(crawlRepository).toBeDefined();
  });

  const getCrawlDto: GetCrawlDto = {
    url: 'https://ziggle.gistory.me',
    password: 'test password',
  };

  const createCrawlDto: CreateCrawlDto = {
    title: 'crawl title',
    body: 'crawl body',
    type: 'ACADEMIC',
    url: 'https://ziggle.gistory.me',
    createdAt: new Date(),
    authorName: 'author',
    password: 'test password',
  };

  const user: User = {
    uuid: 'b8f00000-1111-2222-9ec7-12189c137aff',
    name: 'user',
    createdAt: new Date(),
    consent: false,
  };

  const deadline = null;

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
    it('should throw ForbiddenException when password is not valid', async () => {
      await expect(crawlService.getCrawlData(getCrawlDto)).rejects.toThrow(
        new ForbiddenException('Invalid password'),
      );
    });

    it('should call crawlRepository.getCrawlData', async () => {
      configService.get.mockReturnValue('test password');
      crawlRepository.getCrawlData.mockResolvedValue(crawlResult);

      await crawlService.getCrawlData(getCrawlDto);

      expect(crawlRepository.getCrawlData).toHaveBeenCalledWith(getCrawlDto);
    });

    it('should return crawl result', async () => {
      configService.get.mockReturnValue('test password');
      crawlRepository.getCrawlData.mockResolvedValue(crawlResult);

      const result = await crawlService.getCrawlData(getCrawlDto);

      expect(result).toEqual(crawlResult);
      expect(crawlRepository.getCrawlData).toHaveBeenCalledWith(getCrawlDto);
    });

    it('should throw NotFoundException when crawl not found', async () => {
      configService.get.mockReturnValue('test password');
      crawlRepository.getCrawlData.mockResolvedValue(null);

      await expect(crawlService.getCrawlData(getCrawlDto)).rejects.toThrow(
        new NotFoundException('Crawl not found'),
      );
      expect(crawlRepository.getCrawlData).toHaveBeenCalledWith(getCrawlDto);
    });
  });

  describe('about createCrawl', () => {
    it('should throw ForbiddenException when password is not valid', async () => {
      await expect(crawlService.createCrawl(createCrawlDto)).rejects.toThrow(
        new ForbiddenException('Invalid password'),
      );
    });

    it('should call userService.findOrCreateTempUser, aiService.detectDeadline, crawlRepository.createCrawl', async () => {
      configService.get.mockReturnValue('test password');
      userService.findOrCreateTempUser.mockResolvedValue(user);
      aiService.detectDeadline.mockResolvedValue(deadline);

      await crawlService.createCrawl(createCrawlDto);

      expect(userService.findOrCreateTempUser).toHaveBeenCalledWith({
        name: createCrawlDto.authorName,
      });
      expect(aiService.detectDeadline).toHaveBeenCalledWith(
        createCrawlDto.body,
        createCrawlDto.createdAt,
      );
      expect(crawlRepository.createCrawl).toHaveBeenCalledWith(
        createCrawlDto,
        deadline,
        user,
      );
    });

    it('should throw error when userService.findOrCreateTempUser throws error', async () => {
      configService.get.mockReturnValue('test password');
      userService.findOrCreateTempUser.mockRejectedValue(new Error());

      await expect(crawlService.createCrawl(createCrawlDto)).rejects.toThrow(
        Error,
      );
    });

    it('should throw error when aiService.detectDeadline throws error', async () => {
      configService.get.mockReturnValue('test password');
      userService.findOrCreateTempUser.mockResolvedValue(user);
      aiService.detectDeadline.mockRejectedValue(Error());

      await expect(crawlService.createCrawl(createCrawlDto)).rejects.toThrow(
        Error,
      );
    });

    it('should throw error when crawlRepository.createCrawl throws error', async () => {
      configService.get.mockReturnValue('test password');
      userService.findOrCreateTempUser.mockResolvedValue(user);
      aiService.detectDeadline.mockResolvedValue(deadline);
      crawlRepository.createCrawl.mockRejectedValue(Error());

      await expect(crawlService.createCrawl(createCrawlDto)).rejects.toThrow(
        Error,
      );
    });
  });

  describe('about updateCrawl', () => {
    it('should call crawlRepository.getCrawlData, crawlRepository.updateCrawl', async () => {
      crawlRepository.getCrawlData.mockResolvedValue(crawlResult);

      await crawlService.updateCrawl(createCrawlDto);

      expect(crawlRepository.getCrawlData).toHaveBeenCalledWith({
        url: getCrawlDto.url,
        password: getCrawlDto.password,
      });
      expect(crawlRepository.updateCrawl).toHaveBeenCalledWith(
        createCrawlDto,
        crawlResult.id,
      );
    });

    it('should throw NotFoundException when crawl not found', async () => {
      crawlRepository.getCrawlData.mockResolvedValue(null);

      await expect(crawlService.updateCrawl(createCrawlDto)).rejects.toThrow(
        new NotFoundException('Crawl not found'),
      );
      expect(crawlRepository.getCrawlData).toHaveBeenCalledWith({
        url: getCrawlDto.url,
        password: getCrawlDto.password,
      });
    });

    it('should throw error when crawlRepository.getCrawlData throws error', async () => {
      crawlRepository.getCrawlData.mockRejectedValue(new Error());

      await expect(crawlService.updateCrawl(createCrawlDto)).rejects.toThrow(
        Error,
      );
    });

    it('should throw error when crawlRepository.updateCrawl throws error', async () => {
      crawlRepository.getCrawlData.mockResolvedValue(crawlResult);
      crawlRepository.updateCrawl.mockRejectedValue(Error());

      await expect(crawlService.updateCrawl(createCrawlDto)).rejects.toThrow(
        Error,
      );
    });
  });
});
