import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class BookmarkNoticeDto {
  @ApiProperty({
    example: true,
    description: '공지를 북마크했는지 여부',
  })
  @IsBoolean()
  bookmarked: boolean;
}
