import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '@prisma/client';

export class TagResDto implements Tag {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'tag',
  })
  name: string;
}
