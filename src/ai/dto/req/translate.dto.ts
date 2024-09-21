import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TranslateDto {
  @ApiProperty({
    description: 'Text to translate',
    example: '안녕 세상!',
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Language to translate',
    example: 'ko',
  })
  @IsString()
  lang: string;
}
