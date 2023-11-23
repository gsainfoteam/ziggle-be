import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { CreateTagDto } from './dto/createTag.dto';
import { GetTagDto } from './dto/getTag.dto';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async findAllTags(): Promise<Tag[]> {
    return this.tagRepository.findAllTags();
  }

  async findTag({ name }: Pick<GetTagDto, 'name'>): Promise<Tag> {
    return this.tagRepository.findTag({ name });
  }

  async searchTag({ search }: Pick<GetTagDto, 'search'>): Promise<Tag[]> {
    return this.tagRepository.searchTag({ search });
  }

  async createTag({ name }: CreateTagDto): Promise<Tag> {
    return this.tagRepository.createTag({ name });
  }

  async deleteTag(id: number): Promise<void> {
    await this.tagRepository.deleteTag(id);
  }

  async findOrCreateTags(tags: string[]): Promise<Tag[]> {
    return this.tagRepository.findOrCreateTags(tags);
  }
}
