import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@generated/prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AuthorDto {
  @Expose()
  @ApiProperty()
  uuid: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  picture: string | null;
}

@Exclude()
export class GroupDto {
  @Expose()
  @ApiProperty()
  uuid: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiPropertyOptional({ type: String })
  profileImageUrl: string | null;
}

@Exclude()
export class GeneralReactionDto {
  @Expose()
  @ApiProperty()
  emoji: string;

  @Expose()
  @ApiProperty()
  count: number;

  @Expose()
  @ApiProperty()
  isReacted: boolean;
}

@Exclude()
export class GeneralNoticeDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @Type(() => GroupDto)
  @ApiPropertyOptional({ type: GroupDto })
  group: GroupDto | null;

  @Expose()
  @Type(() => AuthorDto)
  @ApiProperty()
  author: AuthorDto;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: [String] })
  tags: string[];

  @Expose()
  @ApiProperty()
  views: number;

  @Expose()
  @ApiProperty({ type: [String] })
  langs: string[];

  @Expose()
  @ApiProperty()
  content: string;

  @Expose()
  @Type(() => GeneralReactionDto)
  @ApiProperty({ type: [GeneralReactionDto] })
  reactions: GeneralReactionDto[];

  @Expose()
  @ApiProperty()
  isReminded: boolean;

  @Expose()
  @ApiProperty()
  category: Category;

  @Expose()
  @ApiPropertyOptional({ type: Date })
  deadline: Date | null;

  @Expose()
  @ApiPropertyOptional({ type: Date })
  currentDeadline: Date | null;

  @Expose()
  @ApiProperty()
  publishedAt: Date;

  @Expose()
  @ApiProperty({ type: [String] })
  imageUrls: string[];

  @Expose()
  @ApiProperty({ type: [String] })
  documentUrls: string[];

  @Expose()
  @ApiPropertyOptional({ type: String })
  crawledUrl: string | null;

  @Expose()
  @ApiProperty({ type: Boolean })
  isViewed: boolean;

  @Expose()
  @ApiProperty({ type: Boolean })
  isBookmarked: boolean;

  constructor(partial: GeneralNoticeDto) {
    this.id = partial.id;
    this.title = partial.title;
    this.group = partial.group;
    this.author = partial.author;
    this.createdAt = partial.createdAt;
    this.tags = partial.tags;
    this.views = partial.views;
    this.langs = partial.langs;
    this.content = partial.content;
    this.reactions = partial.reactions;
    this.isReminded = partial.isReminded;
    this.category = partial.category;
    this.deadline = partial.deadline;
    this.currentDeadline = partial.currentDeadline;
    this.publishedAt = partial.publishedAt;
    this.imageUrls = partial.imageUrls;
    this.documentUrls = partial.documentUrls;
    this.crawledUrl = partial.crawledUrl;
    this.isViewed = partial.isViewed;
    this.isBookmarked = partial.isBookmarked;
  }
}

@Exclude()
export class GeneralNoticeListDto {
  @Expose()
  @ApiProperty()
  total: number;

  @Expose()
  @ApiProperty({ type: [GeneralNoticeDto] })
  list: GeneralNoticeDto[];

  constructor(partial: GeneralNoticeListDto) {
    this.total = partial.total;
    this.list = partial.list;
  }
}
