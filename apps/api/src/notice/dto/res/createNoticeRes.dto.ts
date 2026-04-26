import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ExpandedGeneralNoticeDto } from './expandedGeneralNotice.dto';
import { Tag } from '@generated/prisma/client';

export class CreateNoticeResDto extends OmitType(ExpandedGeneralNoticeDto, [
  'tags',
]) {
  @Expose()
  @Transform(({ value }: { value: Tag[] }) => value.map(({ id }) => id))
  @ApiProperty({ type: [Number] })
  tags: number[] | Tag[];

  constructor(partial: Partial<CreateNoticeResDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
