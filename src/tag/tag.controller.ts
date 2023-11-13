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
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { GetTagDto } from './dto/getTag.dto';
import { CreateTagDto } from './dto/createTag.dto';
import { convertCaseInterceptor } from 'src/global/interceptor/convertCase.interceptor';

@Controller('tag')
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(convertCaseInterceptor)
export class TagController {
  constructor(private tagService: TagService) {}

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

  @Post()
  async create(@Body() body: CreateTagDto) {
    return this.tagService.createTag(body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.deleteTag(id);
  }
}
