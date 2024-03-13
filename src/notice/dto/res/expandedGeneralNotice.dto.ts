import { ApiProperty } from '@nestjs/swagger';
import { GeneralNoticeDto } from './generalNotice.dto';

export class ExpandedGeneralNoticeDto extends GeneralNoticeDto {
  @ApiProperty()
  additionalContents: AdditionalNoticeDto[];
}

export class AdditionalNoticeDto {
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
