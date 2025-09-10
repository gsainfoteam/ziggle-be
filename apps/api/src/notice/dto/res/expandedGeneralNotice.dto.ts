import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralNoticeDto } from './generalNotice.dto';
import { Expose } from 'class-transformer';

class AdditionalContentsDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  lang: string;

  @ApiPropertyOptional({ type: Date })
  deadline: Date | null;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;
}

export class ExpandedGeneralNoticeDto extends GeneralNoticeDto {
  @Expose()
  @ApiProperty({ type: [AdditionalContentsDto] })
  get additionalContents(): AdditionalContentsDto[] {
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
