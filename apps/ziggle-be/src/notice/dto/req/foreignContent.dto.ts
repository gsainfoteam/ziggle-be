import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class ForeignContentDto {
  @ApiProperty({
    example: 'en',
    description: '언어',
    required: true,
  })
  @IsString()
  lang: string;

  @ApiProperty({
    example: '제목',
    description: '바뀐 제목 (현재 진짜로 바뀌지는 않음)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    example: '영어 내용',
    description: '영어로 된 내용',
    required: true,
  })
  @IsString()
  @MaxLength(100000)
  body: string;

  @ApiProperty({
    example: '2021-08-01T00:00:00.000Z',
    description: '마감일, 가장 최근에 post한 것을 기준으로 설정됨',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;
}
