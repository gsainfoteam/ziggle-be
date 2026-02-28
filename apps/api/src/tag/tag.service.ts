import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TagRepository } from './tag.repository';
import { Tag } from '@prisma/client';
import { GetTagDto } from './dto/req/getTag.dto';
import { Loggable } from '@lib/logger/decorator/loggable';
import { CreateTagDto } from './dto/req/createTag.dto';

@Injectable()
@Loggable()
export class TagService {
  private readonly logger = new Logger(TagService.name);
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * find all tags
   * @returns list of tags
   */
  async findAllTags(): Promise<Tag[]> {
    return this.tagRepository.findAllTags();
  }

  /**
   * find tag by name
   * @param name
   * @returns tag
   */
  async findTag(name: string): Promise<Tag> {
    return this.tagRepository.findTag(name);
  }

  /**
   * search tags by name
   * @param search
   * @returns list of tags
   */
  async searchTags(search: string): Promise<Tag[]> {
    return this.tagRepository.searchTags(search);
  }

  /**
   * create tag
   * @param name
   * @returns tag
   */
  async createTag({ name }: CreateTagDto): Promise<Tag> {
    if (!name) {
      this.logger.debug('name is required');
      throw new BadRequestException('name is required');
    }
    return this.tagRepository.createTag({ name });
  }

  /**
   * delete tag
   * @param id
   * @returns void
   */
  async deleteTag({ id }: Pick<Tag, 'id'>): Promise<void> {
    if (!id) {
      this.logger.debug('id is required');
      throw new BadRequestException('id is required');
    }
    return this.tagRepository.deleteTag({ id });
  }
}
