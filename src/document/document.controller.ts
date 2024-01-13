import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('document')
@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

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
  @Post('upload')
  @UseInterceptors(FilesInterceptor('documents'))
  async uploadDocument(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<string[]> {
    return this.documentService.uploadDocuments(files);
  }
}
