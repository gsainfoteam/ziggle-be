import {
  Body,
  Controller,
  Get,
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
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetTagDto } from './dto/req/getTag.dto';
import { CreateTagDto } from './dto/req/createTag.dto';
import { TagResDto } from './dto/res/TagRes.dto';
import { IdPGuard } from '../user/guard/idp.guard';

@ApiTags('tag')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
@Controller('tag')
@UsePipes(new ValidationPipe({ transform: true }))
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
    if (query.name) {
      return this.tagService.findTag({ name: query.name });
    }
    if (query.search) {
      return this.tagService.searchTags({ search: query.search });
    }
    return this.tagService.findAllTags();
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
  @UseGuards(IdPGuard)
  @Post()
  async create(@Body() body: CreateTagDto) {
    return this.tagService.createTag(body);
  }
}
