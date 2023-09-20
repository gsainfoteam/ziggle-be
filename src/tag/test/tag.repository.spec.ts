import { Test, TestingModule } from '@nestjs/testing';
import { TagRepository } from '../tag.repository';
import { Tag } from 'src/global/entity/tag.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { testModule } from 'src/global/test/test.module';
import { Repository } from 'typeorm';

describe('TagRepository', () => {
  let tagRepository: TagRepository;
  let repository: Repository<Tag>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [testModule, TypeOrmModule.forFeature([Tag])],
      providers: [TagRepository],
    }).compile();

    tagRepository = module.get<TagRepository>(TagRepository);
    repository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
  });

  it('should be defined', () => {
    expect(tagRepository).toBeDefined();
  });

  describe('findTagList', () => {
    it('should return an array of tags', async () => {
      const result = [new Tag()];
      jest.spyOn(repository, 'find').mockResolvedValue(result);

      expect(await tagRepository.findTagList([1])).toBe(result);
    });

    it('should return an empty array', async () => {
      const result = [];
      jest.spyOn(repository, 'find').mockResolvedValue(result);

      expect(await tagRepository.findTagList([1])).toBe(result);
    });
  });
});
