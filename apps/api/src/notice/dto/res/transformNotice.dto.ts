import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TransformNoticeDto {
  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  langs: string[];

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @ApiProperty()
  deadline: Date | null;

  @Expose()
  @ApiProperty()
  tags: string[];

  @Expose()
  @ApiProperty()
  isReminded: boolean;

  @Expose()
  @ApiProperty()
  imageUrls?: string[];

  @Expose()
  @ApiProperty()
  documentUrls?: string[];

  @Expose()
  @ApiProperty()
  reactions: GeneralReactionDto[];

  constructor(partial: Partial<TransformNoticeDto>) {
    Object.assign(this, partial);
  }
}

class GeneralReactionDto {
  @ApiProperty()
  emoji: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  isReacted: boolean;

  @ApiProperty()
  userId?: string;
}
