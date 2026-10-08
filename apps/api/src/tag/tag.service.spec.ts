import { BadRequestException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { TagRepository } from './tag.repository';
import { TagService } from './tag.service';

describe('TagService', () => {
  let service: TagService;
  let tagRepository: MockProxy<TagRepository>;

  beforeEach(() => {
    tagRepository = mock<TagRepository>();
    service = new TagService(tagRepository);
  });

  describe('createTag', () => {
    it('creates a tag with the given name', async () => {
      tagRepository.createTag.mockResolvedValue({ id: 1, name: 'tag' });

      await expect(service.createTag({ name: 'tag' })).resolves.toEqual({
        id: 1,
        name: 'tag',
      });
      expect(tagRepository.createTag).toHaveBeenCalledWith({ name: 'tag' });
    });

    it('throws BadRequest for an empty name', async () => {
      await expect(service.createTag({ name: '' })).rejects.toThrow(
        BadRequestException,
      );
      expect(tagRepository.createTag).not.toHaveBeenCalled();
    });
  });

  describe('deleteTag', () => {
    it('deletes the tag with the given id', async () => {
      await service.deleteTag({ id: 1 });

      expect(tagRepository.deleteTag).toHaveBeenCalledWith({ id: 1 });
    });

    it('throws BadRequest for a missing id', async () => {
      await expect(service.deleteTag({ id: 0 })).rejects.toThrow(
        BadRequestException,
      );
      expect(tagRepository.deleteTag).not.toHaveBeenCalled();
    });
  });
});
