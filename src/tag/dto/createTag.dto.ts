import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    example: '태그',
    description: '태그 이름',
    required: true,
  })
  @IsString()
  name: string;
}
