import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;
}
export class GeneralNoticeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty()
  author: AuthorDto;

  @ApiProperty()
  createdAt: Date;

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
  deadline: Date | null;

  @ApiProperty()
  currentDeadline: Date | null;

  @ApiPropertyOptional()
  imageUrls?: string[];

  @ApiPropertyOptional()
  documentUrls?: string[];
}

export class GeneralReactionDto {
  @ApiProperty()
  emoji: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  isReacted: boolean;
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
