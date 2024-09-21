import { ApiProperty } from '@nestjs/swagger';
import { IsISO31661Alpha2, IsString } from 'class-validator';

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
  @IsISO31661Alpha2()
  targetLang: string;
}
