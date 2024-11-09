import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsLocale, IsString } from 'class-validator';
import * as deepl from 'deepl-node';

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
  @Transform(({ value }) => {
    if (value === 'en') {
      return 'en-US';
    }
    return value;
  })
  targetLang: deepl.TargetLanguageCode;
}
