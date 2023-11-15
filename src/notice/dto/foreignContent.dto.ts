import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class ForeignContentDto {
  @IsString()
  lang: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(3000)
  body: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;
}
