import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
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

  @ApiProperty({
    example: '2021-08-01T00:00:00.000Z',
    description: '마감일',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;

  @ApiProperty({
    example: '1',
    description: '공지태그의 id',
    required: false,
  })
  @IsNumber({}, { each: true })
  @IsOptional()
  tags: number[] = [];

  @ApiProperty({
    example: 'wow.png',
    description: '이미지 파일 이름',
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  images: string[] = [];
}
