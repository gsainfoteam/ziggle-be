import { IsOptional, IsString } from 'class-validator';

export class GetTagDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
