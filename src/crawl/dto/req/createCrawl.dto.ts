import { CrawlType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

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
}
