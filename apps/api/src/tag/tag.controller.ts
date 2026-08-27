import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TagService } from './tag.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateTagDto } from './dto/req/createTag.dto';
import { TagResDto } from './dto/res/TagRes.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetTagDto } from './dto/req/getTag.dto';

@ApiTags('tag')
@ApiBearerAuth('jwt')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2') // deprecated
@Controller('tag')
@UsePipes(new ValidationPipe({ transform: true }))
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @ApiOperation({
    summary: 'Find all tags or search tags by name',
    description: 'Find all tags or search tags by name',
  })
  @ApiOkResponse({
    description: 'List of tags',
    type: [TagResDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get()
  async findAll(@Query() query: GetTagDto): Promise<TagResDto[] | TagResDto> {
    // deprecated 49 ~ 52
    if (query.name) {
      return this.tagService.findTag(query.name);
    }
    if (query.search) {
      return this.tagService.searchTags(query.search);
    }
    return this.tagService.findAllTags();
  }

  @ApiOperation({
    summary: 'Find tag by name',
    description: 'Find tag by name',
  })
  @ApiOkResponse({
    description: 'Tag',
    type: TagResDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not Found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get(':name')
  async findOne(@Param('name') name: string): Promise<TagResDto> {
    return this.tagService.findTag(name);
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
  @UseGuards(JwtGuard)
  @Post()
  async create(@Body() body: CreateTagDto) {
    return this.tagService.createTag(body);
  }
}
