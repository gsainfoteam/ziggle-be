import { ApiProperty } from '@nestjs/swagger';
import { IsLocale, IsString } from 'class-validator';

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
  @IsLocale()
  targetLang: string;
}
