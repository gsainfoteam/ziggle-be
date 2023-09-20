import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from 'src/global/entity/tag.entity';
import { Repository, Like, DeleteResult } from 'typeorm';
import { CreateTagDto } from './dto/createTag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
  ) {}

  async findAllTags(): Promise<Tag[]> {
    return this.tagRepository.find();
  }

  async getTag(name: string): Promise<Tag> {
    const tag = await this.tagRepository.findOneBy({ name });
    if (!tag) {
      throw new NotFoundException(`Notice with ID "${name}" not found`);
    }
    return tag;
  }

  async searchTag(name: string): Promise<Tag[]> {
    const tag = await this.tagRepository.find({
      where: { name: Like(`${name}%`) },
    });
    return tag;
  }

  async createTag({ name }: CreateTagDto): Promise<Tag> {
    const newTag = this.tagRepository.create({ name });
    return this.tagRepository.save(newTag);
  }

  async deleteTag(id: number): Promise<DeleteResult> {
    return this.tagRepository.delete({ id });
  }
}
