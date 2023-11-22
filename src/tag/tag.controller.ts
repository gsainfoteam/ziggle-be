import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { GetTagDto } from './dto/getTag.dto';
import { CreateTagDto } from './dto/createTag.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('tag')
@Controller('tag')
@UsePipes(new ValidationPipe({ transform: true }))
export class TagController {
  constructor(private tagService: TagService) {}

  /* query에 name이 있으면, 그 이름의 tag, search가 있으면, 그 키워드가 들어가는 tag, 아무것도 없으면 모든 tags를 받아오는 api */
  @Get()
  async findAll(@Query() query: GetTagDto) {
    if (Object.keys(query).length === 0) {
      return this.tagService.findAllTags();
    } else if (query.name) {
      return this.tagService.findTag({ name: query.name });
    } else if (query.search) {
      return this.tagService.searchTag({ search: query.search });
    } else {
      throw new BadRequestException('Invalid query parameters');
    }
  }

  /* tag를 만드는 api */
  @Post()
  async create(@Body() body: CreateTagDto) {
    return this.tagService.createTag(body);
  }

  /* tag를 삭제하는 api */
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.deleteTag(id);
  }
}
