import { ApiProperty } from '@nestjs/swagger';
import { GeneralNoticeDto } from './generalNotice.dto';
import { Expose } from 'class-transformer';

export class ExpandedGeneralNoticeDto extends GeneralNoticeDto {
  @Expose()
  @ApiProperty()
  additionalContents: AdditionalNoticeDto[];

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
