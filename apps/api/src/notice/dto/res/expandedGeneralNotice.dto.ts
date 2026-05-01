import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralNoticeDto } from './generalNotice.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AdditionalContentsDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  lang: string;

  @Expose()
  @ApiPropertyOptional({ type: Date })
  deadline: Date | null;

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}

@Exclude()
export class ExpandedGeneralNoticeDto extends GeneralNoticeDto {
  @Expose()
  @Type(() => AdditionalContentsDto)
  @ApiProperty({ type: [AdditionalContentsDto] })
  additionalContents: AdditionalContentsDto[];

  constructor(partial: ExpandedGeneralNoticeDto) {
    super(partial);
    this.additionalContents = partial.additionalContents;
  }
}
