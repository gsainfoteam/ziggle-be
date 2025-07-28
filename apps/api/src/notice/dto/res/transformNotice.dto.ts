import { Expose } from 'class-transformer';
import { GeneralReactionDto } from './generalNotice.dto';

export class TransformNoticeDto {
  @Expose()
  title: string;

  @Expose()
  langs: string[];

  @Expose()
  content: string;

  @Expose()
  deadline: Date | null;

  @Expose()
  tags: string[];

  @Expose()
  isReminded: boolean;

  @Expose()
  imageUrls?: string[];

  @Expose()
  documentUrls?: string[];

  @Expose()
  reactions: GeneralReactionDto[];

  constructor(partial: Partial<TransformNoticeDto>) {
    Object.assign(this, partial);
  }
}
