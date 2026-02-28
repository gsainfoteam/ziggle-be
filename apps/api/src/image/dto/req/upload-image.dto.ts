import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'The image files to upload',
  })
  images?: Express.Multer.File[];
}
