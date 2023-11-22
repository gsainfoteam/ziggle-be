import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdditionalNoticeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(100000)
  body: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;
}
