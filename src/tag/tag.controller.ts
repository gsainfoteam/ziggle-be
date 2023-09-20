import {
  Controller,
  Body,
  Param,
  Get,
  Post,
  Delete,
  Query,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/createTag.dto';

@Controller('tag')
export class TagController {
  constructor(private tagService: TagService) {}

  @Get()
  async getAllTags() {
    return this.tagService.findAllTags();
  }

  @Get('/one')
  async getOneTag(@Query('name') name: string) {
    return this.tagService.getTag(name);
  }

  @Get('/search')
  async searchTag(@Query('name') name: string) {
    return this.tagService.searchTag(name);
  }

  @Post()
  createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagService.createTag(createTagDto);
  }

  @Delete('/:id')
  deleteTag(@Param('id') id: number) {
    return this.tagService.deleteTag(id);
  }
}
