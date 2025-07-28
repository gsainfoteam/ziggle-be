import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category, FileType } from '@prisma/client';
import { Exclude, Expose, Transform } from 'class-transformer';
import { htmlToText } from 'html-to-text';

export class AuthorDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;
}

export class GeneralNoticeDto {
  @Exclude()
  langFromDto?: string;
  @Exclude()
  crawls: crawlsDto[];
  @Exclude()
  contents: contentsDto[];
  @Exclude()
  files: filesDto[];
  @Exclude()
  s3Url: string;
  @Exclude()
  reminders: remindersDto[];
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
  group: groupDto | null;

  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @Transform(({ obj }: { obj: GeneralNoticeDto }) => {
    const mainContent =
      obj.contents.filter(
        ({ lang }) => lang === (obj.langFromDto ?? 'ko'),
      )[0] ?? obj.contents[0];
    return obj.crawls.length > 0
      ? obj.crawls[0].title
      : (mainContent.title as string);
  })
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  groupId: string | null;

  @Expose()
  @ApiProperty()
  author: AuthorDto;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.tags.map(({ name }: { name: string }) => name))
  @ApiProperty()
  tags: string[] | object[];

  @Expose()
  @ApiProperty()
  views: number;

  @Expose()
  @Transform(({ obj }: { obj: GeneralNoticeDto }) =>
    obj.crawls.length > 0
      ? ['ko']
      : Array.from(new Set(obj.contents.map(({ lang }) => lang))),
  )
  @ApiProperty()
  langs: string[];

  @Expose()
  @Transform(({ obj }: { obj: GeneralNoticeDto }) => {
    const mainContent =
      obj.contents.filter(
        ({ lang }) => lang === (obj.langFromDto ?? 'ko'),
      )[0] ?? obj.contents[0];
    const content =
      obj.crawls.length > 0 ? obj.crawls[0].body : mainContent.body;
    return htmlToText(content, {
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    }).slice(0, 1000);
  })
  @ApiProperty()
  content: string;

  @Expose()
  @ApiProperty()
  reactions: GeneralReactionDto[];

  @Expose()
  @Transform(({ obj }: { obj: GeneralNoticeDto }) =>
    obj.reminders.some(({ uuid }) => uuid === obj.userUuid),
  )
  @ApiProperty()
  isReminded: boolean;

  @Expose()
  @ApiProperty()
  category: Category;

  @Expose()
  @Transform(({ obj }: { obj: GeneralNoticeDto }) => {
    const mainContent =
      obj.contents.filter(
        ({ lang }) => lang === (obj.langFromDto ?? 'ko'),
      )[0] ?? obj.contents[0];
    return obj.crawls.length > 0 ? null : mainContent.deadline ?? null;
  })
  @ApiProperty()
  deadline: Date | null;

  @Expose()
  @ApiProperty()
  currentDeadline: Date | null;

  @Expose()
  @ApiProperty()
  publishedAt: Date;

  @Expose()
  @Transform(({ obj }: { obj: GeneralNoticeDto }) =>
    obj.files
      ?.filter(({ type }) => type === FileType.IMAGE)
      .map(({ url }) => `${obj.s3Url}${url}`),
  )
  @ApiPropertyOptional()
  imageUrls?: string[];

  @Expose()
  @Transform(({ obj }: { obj: GeneralNoticeDto }) =>
    obj.files
      ?.filter(({ type }) => type === FileType.DOCUMENT)
      .map(({ url }) => `${obj.s3Url}${url}`),
  )
  @ApiPropertyOptional()
  documentUrls?: string[];

  constructor(partial: Partial<GeneralNoticeDto>) {
    Object.assign(this, partial);
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

class crawlsDto {
  id: number;
  title: string;
  body: string;
  type: 'ACADEMIC';
  url: string;
  crawledAt: Date;
  noticeId: number;
}

class contentsDto {
  id: number;
  lang: string;
  title: string | null;
  body: string;
  deadline: Date | null;
  createdAt: Date;
  noticeId: number;
}

class filesDto {
  uuid: string;
  order: number;
  name: string;
  createdAt: Date;
  url: string;
  type: FileType;
  noticeId: number;
}

class remindersDto {
  uuid: string;
  name: string;
  createdAt: Date;
  consent: boolean;
}

class groupDto {
  uuid: string;
  name: string;
}
