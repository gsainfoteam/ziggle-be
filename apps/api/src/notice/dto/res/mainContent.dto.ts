import { Exclude, Expose } from 'class-transformer';

export class MainContentsDto {
  @Expose()
  title: string;

  @Expose()
  langs: string[];

  @Expose()
  content: string;

  @Expose()
  deadline: Date | null;

  constructor(partial: Partial<MainContentsDto>) {
    Object.assign(this, partial);
  }
}

export class CrawlsDto {
  id: number;
  title: string;
  body: string;
  type: 'ACADEMIC';
  url: string;
  crawledAt: Date;
  noticeId: number;
}

export class ContentsDto {
  id: number;
  lang: string;
  title: string | null;
  body: string;
  deadline: Date | null;
  createdAt: Date;
  noticeId: number;
}
