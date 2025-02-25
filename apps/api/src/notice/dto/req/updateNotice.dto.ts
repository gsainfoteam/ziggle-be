import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateNoticeDto {
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
}

export class UpdateNoticeQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Content IDX, Default: 1',
    required: false,
  })
  @IsString()
  @IsOptional()
  idx?: number;

  @ApiProperty({
    example: 'ko',
    description: 'Language, Default: ko',
    required: false,
  })
  @IsString()
  @IsOptional()
  lang?: string;
}
