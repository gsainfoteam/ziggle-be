import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class GetNoticeDto {
  @ApiProperty({
    example: 'true',
    description: '공지를 읽었는지 여부, 기본값은 false',
    required: false,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  isViewed?: boolean;

  @ApiProperty({
    example: 'en',
    description: '언어',
    required: false,
  })
  @IsString()
  @IsOptional()
  lang?: string;
}
