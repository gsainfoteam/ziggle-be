import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetTagDto {
  @ApiProperty({
    example: '태그',
    description: '검색할 태그의 키워드',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;
}
