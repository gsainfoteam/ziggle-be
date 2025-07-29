import { ApiProperty } from '@nestjs/swagger';
import { Category, File, Group } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';
import { TransformNoticeDto } from './transformNotice.dto';

export class AuthorDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;
}

export class GeneralNoticeDto extends TransformNoticeDto {
  @Exclude()
  files: File[];
  @Exclude()
  crawls: any[];
  @Exclude()
  reminders: any[];
  @Exclude()
  updatedAt: Date | null;
  @Exclude()
  lastEditedAt: Date | null;
  @Exclude()
  deletedAt: Date | null;
  @Exclude()
  authorId: string;
  @Exclude()
  group: Group | null;
  @Exclude()
  contents: any[];

  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  groupId: string | null;

  @Expose()
  @Type(() => AuthorDto)
  @ApiProperty()
  author: AuthorDto;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  views: number;

  @Expose()
  @ApiProperty()
  category: Category;

  @Expose()
  @ApiProperty()
  currentDeadline: Date | null;

  @Expose()
  @ApiProperty()
  publishedAt: Date;

  constructor(partial: Partial<GeneralNoticeDto>) {
    super(partial);
  }
}

export class GeneralReactionDto {
  @ApiProperty()
  emoji: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  isReacted: boolean;

  @ApiProperty()
  userId?: string;
}

export class GeneralNoticeListDto {
  @ApiProperty()
  total: number;

  @ApiProperty({
    type: [GeneralNoticeDto],
    isArray: true,
  })
  list: GeneralNoticeDto[];
}
