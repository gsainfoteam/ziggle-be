import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class GetMainNoticeListQueryDto {
  @ApiPropertyOptional({
    example: 'ko',
    description: '언어',
  })
  @IsOptional()
  @IsEnum(['ko', 'en'])
  lang?: 'ko' | 'en';
}
