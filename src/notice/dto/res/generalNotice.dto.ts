import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneralNoticeListDto {
  @ApiProperty()
  totol: number;

  @ApiProperty()
  list: GeneralNoticeDto[];
}

export class GeneralNoticeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  author: AuthorDto;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  views: number;

  @ApiProperty()
  langs: string[];

  @ApiProperty()
  content: string;

  @ApiProperty()
  reactions: GeneralReactionDto[];

  @ApiProperty()
  isReminded: boolean;

  @ApiProperty()
  deadline: string;

  @ApiProperty()
  currentDeadline: string;

  @ApiPropertyOptional()
  imageUrls?: string[];

  @ApiPropertyOptional()
  documentUrls?: string[];
}

export class AuthorDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;
}

export class GeneralReactionDto {
  @ApiProperty()
  emoji: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  isReacted: boolean;
}
