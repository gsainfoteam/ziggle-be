import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNoticeDto {
  @ApiProperty({
    example: '제목',
    description: '공지 제목',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: '<p>내용<\\p>',
    description: '공지 내용',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  body: string;

  @ApiPropertyOptional({
    example: '2021-08-01T00:00:00.000Z',
    description: '마감일',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;

  @ApiPropertyOptional({
    example: '1',
    description: '공지태그의 id',
    required: false,
  })
  @IsNumber({}, { each: true })
  @IsOptional()
  tags: number[] = [];

  @ApiPropertyOptional({
    description: '공지 그룹의 id',
    required: false,
    enum: Category,
  })
  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @ApiPropertyOptional({
    example: 'wow.png',
    description: '이미지 파일 이름',
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  images: string[] = [];

  @ApiPropertyOptional({
    example: 'wow.docx',
    description: '파일 이름',
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  documents: string[] = [];

  @ApiPropertyOptional({
    example: '공지 그룹 id',
    description: '공지 그룹 id',
    required: false,
  })
  @IsString()
  @IsOptional()
  groupId?: string;
}
