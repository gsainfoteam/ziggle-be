import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetAllNoticeQueryDto {
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
    example: '제목',
    description: '검색할 공지의 제목 혹은 내용',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: '이런',
    description: '공지태그의 이름',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: 'deadline',
    description: '정렬 기준 (deadline, hot, recent)',
    required: false,
  })
  @IsString()
  @IsEnum(['deadline', 'hot', 'recent'])
  @IsOptional()
  orderBy?: 'recent' | 'deadline' | 'hot';

  @ApiProperty({
    example: 'ETC',
    description: '카테고리',
    required: false,
  })
  @IsString()
  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @ApiProperty({
    example: 'own',
    description: '공지 타입 (own, reminders)',
    required: false,
  })
  @IsString()
  @IsEnum(['own', 'reminders'])
  @IsOptional()
  my?: 'own' | 'reminders';
}
