import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Tag } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetTagDto } from './dto/getTag.dto';

@Injectable()
export class TagRepository {
  private readonly logger = new Logger(TagRepository.name);
  constructor(private readonly prismaSerice: PrismaService) {}

  async findAllTags(): Promise<Tag[]> {
    return this.prismaSerice.tag.findMany().catch((err) => {
      this.logger.error('findAllTags');
      this.logger.debug(err);
      throw new InternalServerErrorException('database error');
    });
  }

  async findTag({ name }: Pick<GetTagDto, 'name'>): Promise<Tag> {
    return this.prismaSerice.tag
      .findUniqueOrThrow({ where: { name } })
      .catch((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2025') {
            throw new NotFoundException(`tag with name "${name}" not found`);
          }
        }
        this.logger.error('findTag');
        this.logger.debug(err);
        throw new InternalServerErrorException('database error');
      });
  }

  async searchTag({ search }: Pick<GetTagDto, 'search'>): Promise<Tag[]> {
    return this.prismaSerice.tag
      .findMany({
        where: {
          name: {
            contains: search,
          },
        },
      })
      .catch((err) => {
        this.logger.error('searchTag');
        this.logger.debug(err);
        throw new InternalServerErrorException('database error');
      });
  }

  async createTag({ name }: Pick<Tag, 'name'>): Promise<Tag> {
    return this.prismaSerice.tag.create({ data: { name } }).catch((err) => {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException(`tag with name "${name}" already exists`);
        }
      }
      this.logger.error('createTag');
      this.logger.debug(err);
      throw new InternalServerErrorException('database error');
    });
  }

  async deleteTag(id: number): Promise<void> {
    await this.prismaSerice.tag.delete({ where: { id } }).catch((err) => {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          throw new NotFoundException(`tag with id "${id}" not found`);
        }
      }
      this.logger.error('deleteTag');
      this.logger.debug(err);
      throw new InternalServerErrorException('database error');
    });
  }

  async findOrCreateTags(tags: string[]): Promise<Tag[]> {
    await this.prismaSerice.tag
      .createMany({
        data: tags.map((name) => ({ name })),
        skipDuplicates: true,
      })
      .catch((err) => {
        this.logger.error('findOrCreateTags');
        this.logger.debug(err);
        throw new InternalServerErrorException('database error');
      });
    return this.prismaSerice.tag.findMany({
      where: {
        name: {
          in: tags,
        },
      },
    });
  }
}
