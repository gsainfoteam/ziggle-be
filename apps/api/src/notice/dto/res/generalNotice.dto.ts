import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Category,
  Content,
  Crawl,
  File,
  FileType,
  Reaction,
  Tag,
  User,
} from '@prisma/client';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { htmlToText } from 'html-to-text';

export class AuthorDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;
}

class GroupDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: String })
  profileImageUrl: string | null;
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

export class GeneralNoticeDto {
  @Exclude()
  langFromDto?: string;
  @Exclude()
  crawls: Crawl[];
  @Exclude()
  contents: Content[];
  @Exclude()
  get mainContent(): Content {
    return (
      this.contents.filter(
        ({ lang }) => lang === (this.langFromDto ?? 'ko'),
      )[0] ?? this.contents[0]
    );
  }
  @Exclude()
  files: File[];
  @Exclude()
  s3Url: string;
  @Exclude()
  reminders: User[];
  @Exclude()
  userUuid?: string;
  @Exclude()
  updatedAt: Date | null;
  @Exclude()
  lastEditedAt: Date | null;
  @Exclude()
  deletedAt: Date | null;
  @Exclude()
  authorId: string;
  @Exclude()
  groupId: string | null;

  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  get title(): string {
    return this.crawls.length > 0
      ? this.crawls[0].title
      : (this.mainContent.title as string);
  }

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
  @Transform(({ value }: { value: Tag[] }) => value.map(({ name }) => name))
  @ApiProperty()
  tags: string[] | Tag[];

  @Expose()
  @ApiProperty()
  views: number;

  @Expose()
  @ApiProperty()
  get langs(): string[] {
    return this.crawls.length > 0
      ? ['ko']
      : Array.from(new Set(this.contents.map(({ lang }) => lang)));
  }

  @Expose()
  @ApiProperty()
  get content(): string {
    const content =
      this.crawls.length > 0 ? this.crawls[0].body : this.mainContent.body;
    return htmlToText(content, {
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    }).slice(0, 1000);
  }

  @Expose()
  @Transform(({ obj }: { obj: GeneralNoticeDto }) => {
    const resultReaction = Object.values(
      obj.reactions.reduce<Record<string, Reaction[]>>(
        (acc, reaction: Reaction) => {
          const { emoji } = reaction;
          if (!acc[emoji]) acc[emoji] = [];
          acc[emoji].push(reaction);
          return acc;
        },
        {},
      ),
    );
    return resultReaction.map((reactions) => ({
      emoji: reactions[0].emoji,
      count: reactions.length,
      isReacted: reactions.some(({ userId }) => userId === obj.userUuid),
    }));
  })
  @ApiProperty({ type: [GeneralReactionDto] })
  reactions: GeneralReactionDto[] | Reaction[];

  @Expose()
  @ApiProperty()
  get isReminded(): boolean {
    return this.reminders.some(({ uuid }) => uuid === this.userUuid);
  }

  @Expose()
  @ApiProperty()
  category: Category;

  @Expose()
  @ApiPropertyOptional({ type: Date })
  get deadline(): Date | null {
    return this.crawls.length > 0 ? null : this.mainContent.deadline ?? null;
  }

  @Expose()
  @ApiPropertyOptional({ type: Date })
  currentDeadline: Date | null;

  @Expose()
  @ApiProperty()
  publishedAt: Date;

  @Expose()
  @ApiProperty()
  get imageUrls(): string[] {
    return this.files
      ?.filter(({ type }) => type === FileType.IMAGE)
      .map(({ url }) => `${this.s3Url}${url}`);
  }

  @Expose()
  @ApiProperty()
  get documentUrls(): string[] {
    return this.files
      ?.filter(({ type }) => type === FileType.DOCUMENT)
      .map(({ url }) => `${this.s3Url}${url}`);
  }

  constructor(partial: Partial<GeneralNoticeDto>) {
    Object.assign(this, partial);
  }
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
