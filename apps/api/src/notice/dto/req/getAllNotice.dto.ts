import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetAllNoticeQueryDto {
  @ApiProperty({
    example: '0',
    description: '넘길 공지의 개수',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  offset?: number;

  @ApiProperty({
    example: '10',
    description: '페이지당 공지 개수',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({
    example: 'en',
    description: '언어',
    required: false,
  })
  @IsString()
  @IsOptional()
  lang?: string;

  @ApiProperty({
    example: '제목',
    description: '검색할 공지의 제목 혹은 내용',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['tag1', 'tag2'],
    description: '공지태그의 이름',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: 'deadline',
    description: '정렬 기준 (deadline, hot, recent 중 1개)',
    required: false,
    name: 'order-by',
  })
  @IsString()
  @IsEnum(['deadline', 'hot', 'recent'])
  @IsOptional()
  @Expose({ name: 'order-by' })
  orderBy?: 'recent' | 'deadline' | 'hot';

  /**
   * * @deprecated 모바일 앱의 하위 호환성을 위한 필드입니다. order-by로 요청을 해야합니다.
   */
  @ApiPropertyOptional({
    example: 'deadline',
    description: '정렬 기준 (deprecated 됨, order-by로 요청을 해야합니다.)',
    deprecated: true,
    name: 'orderBy',
  })
  @IsString()
  @IsEnum(['deadline', 'hot', 'recent'])
  @IsOptional()
  @Expose({ name: 'orderBy' })
  @Transform(({ value, obj }) => {
    if (value && !obj['order-by']) {
      obj['order-by'] = value;
    }
    return undefined;
  })
  orderByDeprecated?: 'deadline' | 'hot' | 'recent';

  @ApiProperty({
    example: 'ETC',
    description: '카테고리',
    required: false,
    enum: Category,
  })
  @IsString()
  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @ApiProperty({
    example: 'own',
    description: '공지 타입 (own, reminders)',
    required: false,
  })
  @IsString()
  @IsEnum(['own', 'reminders'])
  @IsOptional()
  my?: 'own' | 'reminders';

  @ApiProperty({
    example: 'b5555555-0000-1111-2222-47997e666666',
    description: '그룹 아이디',
    required: false,
    name: 'group-id',
  })
  @IsString()
  @IsOptional()
  @Expose({ name: 'group-id' })
  groupId?: string;
}
