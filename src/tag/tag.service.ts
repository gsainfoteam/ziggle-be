import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateTagDto } from './dto/createTag.dto';
import { Tag } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { GetTagDto } from './dto/getTag.dto';

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findAllTags(): Promise<Tag[]> {
    this.logger.log('Finding all tags');
    return this.prismaService.tag.findMany();
  }

  async findTag({ name }: Pick<GetTagDto, 'name'>): Promise<Tag> {
    this.logger.log(`Finding tag with name "${name}"`);
    const tag = await this.prismaService.tag.findUnique({ where: { name } });
    if (!tag) {
      throw new NotFoundException(`Notice with ID "${name}" not found`);
    }
    return tag;
  }

  async searchTag({ search }: Pick<GetTagDto, 'search'>): Promise<Tag[]> {
    this.logger.log(`Searching tag with name "${search}"`);
    return this.prismaService.tag.findMany({
      where: {
        name: {
          contains: search,
        },
      },
    });
  }

  async createTag({ name }: CreateTagDto): Promise<Tag> {
    this.logger.log(`Creating tag with name "${name}"`);
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
    this.logger.log(`Deleting tag with ID "${id}"`);
    await this.prismaService.tag.delete({ where: { id } });
  }
}
