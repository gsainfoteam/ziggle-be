import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { NoticeCommonDto } from './generalNotice.dto';

@Exclude()
export class CreateNoticeResDto extends NoticeCommonDto {
  @Expose()
  @ApiProperty({ type: [Number] })
  tags: number[];

  constructor(partial: CreateNoticeResDto) {
    super(partial);
    this.tags = partial.tags;
  }
}
