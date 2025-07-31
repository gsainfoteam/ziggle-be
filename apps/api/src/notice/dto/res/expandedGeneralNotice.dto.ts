import { ApiProperty } from '@nestjs/swagger';
import { GeneralNoticeDto } from './generalNotice.dto';
import { Expose } from 'class-transformer';

export class ExpandedGeneralNoticeDto extends GeneralNoticeDto {
  @Expose()
  @ApiProperty()
  get additionalContents(): AdditionalNoticeDto[] {
    return this.contents
      .filter(({ id }) => id !== 1)
      .map(({ id, createdAt, body, deadline, lang }) => ({
        id,
        content: body,
        deadline: deadline ?? null,
        createdAt,
        lang,
      }));
  }

  @Expose()
  @ApiProperty()
  get content(): string {
    return this.crawls.length > 0 ? this.crawls[0].body : this.mainContent.body;
  }

  constructor(partial: Partial<ExpandedGeneralNoticeDto>) {
    super(partial);
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
