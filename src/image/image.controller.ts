import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiOAuth2,
} from '@nestjs/swagger';
import { ImageService } from './image.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('image')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
@Controller('image')
@UsePipes(ValidationPipe)
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @ApiOperation({
    summary: 'Upload multiple images',
    description:
      'This endpoint allows you to upload multiple images to the S3 bucket',
  })
  @ApiBody({
    required: true,
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ type: [String], status: 201 })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('images'))
  async uploadImage(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<string[]> {
    return this.imageService.uploadImages(files);
  }
}
