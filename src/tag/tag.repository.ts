import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Tag } from "src/global/entity/tag.entity";
import { In, Repository } from "typeorm";

@Injectable()
export class TagRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>
  ) {}

  async findTagList(tagIDs: number[]): Promise<Tag[]> {
    return this.tagRepository.find({ where: { id: In(tagIDs) } });
  }
}