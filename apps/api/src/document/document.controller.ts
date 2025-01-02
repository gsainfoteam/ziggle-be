import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOAuth2,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('document')
@ApiOAuth2(['email', 'profile', 'openid'], 'oauth2')
@Controller('document')
@UsePipes(ValidationPipe)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @ApiOperation({
    summary: 'Upload multiple documents',
    description: 'Upload multiple documents to the S3 bucket',
  })
  @ApiBody({
    required: true,
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        documents: {
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
  @UseInterceptors(FilesInterceptor('documents'))
  async uploadDocument(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<string[]> {
    return this.documentService.uploadDocuments(files);
  }
}
