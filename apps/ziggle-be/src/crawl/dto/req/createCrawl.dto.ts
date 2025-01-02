import { CrawlType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsDate,
} from 'class-validator';

export class CreateCrawlDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsEnum(CrawlType)
  @IsNotEmpty()
  type: CrawlType;

  @IsString()
  @MaxLength(300)
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  createdAt: Date;
}
