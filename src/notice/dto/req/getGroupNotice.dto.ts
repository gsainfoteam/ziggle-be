import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetGroupNoticeQueryDto {
  @ApiProperty({
    example: '0',
    description: '넘길 공지의 개수',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  offset?: number;

  @ApiProperty({
    example: '10',
    description: '페이지당 공지 개수',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({
    example: 'en',
    description: '언어',
    required: false,
  })
  @IsString()
  @IsOptional()
  lang?: string;

  @ApiProperty({
    example: 'deadline',
    description: '정렬 기준 (deadline, hot, recent)',
    required: false,
  })
  @IsString()
  @IsEnum(['deadline', 'hot', 'recent'])
  @IsOptional()
  orderBy?: 'recent' | 'deadline' | 'hot';
}
