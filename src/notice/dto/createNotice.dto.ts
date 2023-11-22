import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  body: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;

  @IsNumber({}, { each: true })
  @IsOptional()
  tags: number[] = [];

  @IsString({ each: true })
  @IsOptional()
  images: string[] = [];
}
