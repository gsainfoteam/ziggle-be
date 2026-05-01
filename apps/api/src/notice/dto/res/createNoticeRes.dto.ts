import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ExpandedGeneralNoticeDto } from './expandedGeneralNotice.dto';

@Exclude()
export class CreateNoticeResDto extends OmitType(ExpandedGeneralNoticeDto, [
  'tags',
]) {
  @Expose()
  @ApiProperty({ type: [Number] })
  tags: number[];

  constructor(partial: CreateNoticeResDto) {
    super(partial);
    this.tags = partial.tags;
  }
}
