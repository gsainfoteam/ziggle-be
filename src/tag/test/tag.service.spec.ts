import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from '../tag.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tag } from 'src/global/entity/tag.entity';
import { CreateTagDto } from '../dto/createTag.dto';

const mockRepository = () => ({
  find: jest.fn().mockReturnValue([new Tag()]),
  findOneBy: jest.fn().mockReturnValue(new Tag()),
  findTagList: jest.fn(),
  create: jest.fn().mockImplementation((dto: CreateTagDto) => dto),
  save: jest.fn().mockImplementation((dto: CreateTagDto) => dto),
  delete: jest.fn().mockReturnValue({ affected: 1 }),
});

describe('TagService', () => {
  let service: TagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        { provide: getRepositoryToken(Tag), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllTags', () => {
    it('should return an array of tags', async () => {
      const result = [new Tag()];
      expect(await service.findAllTags()).toEqual(result);
    });

    // it('should throw NotFoundException when repository returns undefined', async () => {
    //   (service as any).tagRepository.find.mockReturnValue(undefined);
    //   expect(service.findAllTags()).rejects.toThrow();
    // });
  });

  describe('getTag', () => {
    it('should return a tag', async () => {
      const result = new Tag();
      expect(await service.getTag('test')).toEqual(result);
    });

    it('should throw NotFoundException when repository returns undefined', async () => {
      (service as any).tagRepository.findOneBy.mockReturnValue(undefined);
      expect(service.getTag('test')).rejects.toThrow();
    });
  });

  describe('searchTag', () => {
    it('should return an array of tags', async () => {
      const result = [new Tag()];
      expect(await service.searchTag('test')).toEqual(result);
    });

    // it('should throw NotFoundException when repository returns undefined', async () => {
    //   (service as any).tagRepository.find.mockReturnValue(undefined);
    //   expect(service.searchTag('test')).rejects.toThrow();
    // });
  });

  describe('createTag', () => {
    it('should return a tag', async () => {
      const testName = 'test';
      const result = new Tag();
      result.name = testName;
      expect(await service.createTag({ name: testName })).toEqual(result);
    });

    // it('should throw ConflictException when repository returns undefined', async () => {
    //   (service as any).tagRepository.save.mockReturnValue(undefined);
    //   expect(service.createTag({ name: 'test' })).rejects.toThrow();
    // });
  });

  describe('deleteTag', () => {
    it('should return void', async () => {
      expect(await service.deleteTag(1)).toHaveProperty('affected', 1);
    });

    // it('should throw NotFoundException when repository returns undefined', async () => {
    //   (service as any).tagRepository.delete.mockReturnValue(undefined);
    //   expect(service.deleteTag(1)).rejects.toThrow();
    // });
  });
});
