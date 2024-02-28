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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TagService } from './tag.service';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetTagDto } from './dto/req/getTag.dto';
import { CreateTagDto } from './dto/req/createTag.dto';
import { TagResDto } from './dto/res/TagRes.dto';
import { IdPGuard } from 'src/user/guard/id.guard';

@ApiTags('tag')
@Controller('tag')
@UsePipes(new ValidationPipe({ transform: true }))
@UseGuards(IdPGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @ApiOperation({
    summary: 'Find all tags or find tag by name or search tags by name',
    description: 'Find all tags or find tag by name or search tags by name',
  })
  @ApiOkResponse({
    description: 'List of tags or tag',
    type: TagResDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get()
  async findAll(@Query() query: GetTagDto): Promise<TagResDto | TagResDto[]> {
    if (Object.keys(query).length === 0) {
      return this.tagService.findAllTags();
    } else if (query.name) {
      return this.tagService.findTag(query);
    } else if (query.search) {
      return this.tagService.searchTags(query);
    } else {
      throw new BadRequestException('Invalid query');
    }
  }

  @ApiOperation({
    summary: 'Create tag',
    description: 'Create tag',
  })
  @ApiCreatedResponse({
    description: 'Tag',
    type: TagResDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post()
  async create(@Body() body: CreateTagDto) {
    return this.tagService.createTag(body);
  }

  @ApiOperation({
    summary: 'Delete tag',
    description: 'Delete tag',
  })
  @ApiOkResponse({
    description: 'Tag',
    type: TagResDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.deleteTag({ id });
  }
}
