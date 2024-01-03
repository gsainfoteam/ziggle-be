import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

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
}
