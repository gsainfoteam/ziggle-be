import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { Tag } from '@prisma/client';
import { GetTagDto } from './dto/req/getTag.dto';

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * find all tags
   * @returns list of tags
   */
  async findAllTags(): Promise<Tag[]> {
    this.logger.log('findAllTags');
    return this.tagRepository.findAllTags().then((tags) => {
      this.logger.log('findAllTags finished');
      return tags;
    });
  }

  /**
   * find tag by name
   * @param name
   * @returns tag
   */
  async findTag({ name }: Pick<GetTagDto, 'name'>): Promise<Tag> {
    this.logger.log('findTag');
    if (!name) {
      this.logger.debug('name is required');
      throw new BadRequestException('name is required');
    }
    return this.tagRepository.findTag({ name }).then((tag) => {
      this.logger.log('findTag finished');
      return tag;
    });
  }

  /**
   * search tags by name
   * @param search
   * @returns list of tags
   */
  async searchTags({ search }: Pick<GetTagDto, 'search'>): Promise<Tag[]> {
    this.logger.log('searchTags');
    if (!search) {
      this.logger.debug('search is required');
      throw new BadRequestException('search is required');
    }
    return this.tagRepository.searchTags({ name: search }).then((tags) => {
      this.logger.log('searchTags finished');
      return tags;
    });
  }

  /**
   * create tag
   * @param name
   * @returns tag
   */
  async createTag({ name }: Pick<GetTagDto, 'name'>): Promise<Tag> {
    this.logger.log('createTag');
    if (!name) {
      this.logger.debug('name is required');
      throw new BadRequestException('name is required');
    }
    return this.tagRepository.createTag({ name }).then((tag) => {
      this.logger.log('createTag finished');
      return tag;
    });
  }

  /**
   * delete tag
   * @param id
   * @returns void
   */
  async deleteTag({ id }: Pick<Tag, 'id'>): Promise<void> {
    this.logger.log('deleteTag');
    if (!id) {
      this.logger.debug('id is required');
      throw new BadRequestException('name is required');
    }
    return this.tagRepository.deleteTag({ id }).then(() => {
      this.logger.log('deleteTag finished');
    });
  }
}
