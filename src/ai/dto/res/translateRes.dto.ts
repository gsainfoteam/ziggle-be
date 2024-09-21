import { ApiProperty } from '@nestjs/swagger';

export class TranslateResDto {
  @ApiProperty({
    description: 'Translated text',
    example: 'Hello world!',
  })
  text: string;

  @ApiProperty({
    description: 'Language of the translated text',
    example: 'en',
  })
  lang: string;
}
