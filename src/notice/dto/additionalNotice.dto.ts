import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdditionalNoticeDto {
  @ApiProperty({
    example: '제목',
    description: '바뀐 제목 (현재 진짜로 바뀌지는 않음)',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: '추가 내용',
    description: '추가된 내용',
    required: true,
  })
  @IsString()
  @MaxLength(3000)
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
