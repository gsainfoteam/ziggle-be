import { ApiProperty } from '@nestjs/swagger';
import { GeneralNoticeDto } from './generalNotice.dto';
import { Expose, Transform } from 'class-transformer';

export class ExpandedGeneralNoticeDto extends GeneralNoticeDto {
  @Expose()
  @Transform(({ obj }: { obj: ExpandedGeneralNoticeDto }) =>
    obj.contents
      .filter(({ id }) => id !== 1)
      .map(({ id, createdAt, body, deadline, lang }) => ({
        id,
        content: body,
        deadline: deadline ?? null,
        createdAt,
        lang,
      })),
  )
  @ApiProperty()
  additionalContents: AdditionalNoticeDto[];

  @Expose()
  @Transform(({ obj }: { obj: ExpandedGeneralNoticeDto }) => {
    const mainContent =
      obj.contents.filter(
        ({ lang }) => lang === (obj.langFromDto ?? 'ko'),
      )[0] ?? obj.contents[0];
    return obj.crawls.length > 0 ? obj.crawls[0].body : mainContent.body;
  })
  @ApiProperty()
  content: string;

  constructor(partial: Partial<ExpandedGeneralNoticeDto>) {
    super({});
    Object.assign(this, partial);
  }
}

class AdditionalNoticeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  lang: string;

  @ApiProperty()
  deadline: Date | null;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;
}
