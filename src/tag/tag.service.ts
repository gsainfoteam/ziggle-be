import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTagDto } from './dto/createTag.dto';
import { Tag } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllTags(): Promise<Tag[]> {
    return this.prismaService.tag.findMany();
  }

  async getTag(name: string): Promise<Tag> {
    const tag = await this.prismaService.tag.findUnique({ where: { name } });
    if (!tag) {
      throw new NotFoundException(`Notice with ID "${name}" not found`);
    }
    return tag;
  }

  async searchTag(name: string): Promise<Tag[]> {
    return this.prismaService.tag.findMany({
      where: {
        name: {
          contains: name,
        },
      },
    });
  }

  async createTag({ name }: CreateTagDto): Promise<Tag> {
    return this.prismaService.tag.create({ data: { name } }).catch((err) => {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException();
        }
      }
      throw new InternalServerErrorException();
    });
  }

  async deleteTag(id: number): Promise<void> {
    this.prismaService.tag.delete({ where: { id } });
  }
}
