import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetAllNoticeQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  offset?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsEnum(['deadline', 'hot', 'recent'])
  @IsOptional()
  orderBy?: string;

  @IsString()
  @IsEnum(['own', 'reminders'])
  @IsOptional()
  my?: string;
}
