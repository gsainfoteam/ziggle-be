import { Test, TestingModule } from '@nestjs/testing';
import { TagController } from '../tag.controller';
import { TagService } from '../tag.service';
import { Tag } from 'src/global/entity/tag.entity';
import { TagRepository } from '../tag.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTagDto } from '../dto/createTag.dto';

const mockRepository = () => ({
  find: jest.fn().mockReturnValue([new Tag()]),
  findOneBy: jest.fn().mockReturnValue(new Tag()),
  findTagList: jest.fn(),
  create: jest.fn().mockImplementation((dto: CreateTagDto) => dto),
  save: jest.fn().mockImplementation((dto: CreateTagDto) => dto),
  delete: jest.fn().mockReturnValue({ affected: 1 }),
});

describe('TagController', () => {
  let controller: TagController;
  let service: TagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [TagService, { provide: getRepositoryToken(Tag), useFactory: mockRepository }],
    }).compile();

    controller = module.get<TagController>(TagController);
    service = module.get<TagService>(TagService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllTags', () => {
    it('should return an array of tags', async () => {
      const result = [new Tag()];
      (service as any).tagRepository.find.mockReturnValue(result);

      expect(await controller.getAllTags()).toBe(result);
    });

    // it('should throw NotFoundException when repository returns undefined', async () => {
    //   (service as any).tagRepository.find.mockReturnValue(undefined);
    //   expect(controller.getAllTags()).rejects.toThrow();
    // });
  });

  describe('getOneTag', () => {
    it('should return a tag', async () => {
      const result = new Tag();
      (service as any).tagRepository.findOneBy.mockReturnValue(result);

      expect(await controller.getOneTag('test')).toBe(result);
    });

    // it('should throw NotFoundException when repository returns undefined', async () => {
    //   (service as any).tagRepository.findOneBy.mockReturnValue(undefined);
    //   expect(controller.getOneTag('test')).rejects.toThrow();
    // });
  });

  describe('searchTag', () => {
    it('should return an array of tags', async () => {
      const result = [new Tag()];
      (service as any).tagRepository.find.mockReturnValue(result);

      expect(await controller.searchTag('test')).toBe(result);
    });

    // it('should throw NotFoundException when repository returns undefined', async () => {
    //   (service as any).tagRepository.findTagList.mockReturnValue(undefined);
    //   expect(controller.searchTag('test')).rejects.toThrow();
    // });
  });

  describe('createTag', () => {
    it('should return a tag', async () => {
      const result = new Tag();
      (service as any).tagRepository.create.mockReturnValue(result);

      expect(await controller.createTag({ name: 'test' })).toBe(result);
    });

    // it('should throw NotFoundException when repository returns undefined', async () => {
    //   (service as any).tagRepository.create.mockReturnValue(undefined);
    //   expect(controller.createTag({ name: 'test' })).rejects.toThrow();
    // });
  });

  describe('deleteTag', () => {
    it('should return a tag', async () => {
      const result = { affected: 1 };
      (service as any).tagRepository.delete.mockReturnValue(result);

      expect(await controller.deleteTag(1)).toBe(result);
    });

    // it('should throw NotFoundException when repository returns undefined', async () => {
    //   (service as any).tagRepository.delete.mockReturnValue(undefined);
    //   expect(controller.deleteTag(1)).rejects.toThrow();
    // });
  });
});
