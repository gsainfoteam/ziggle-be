import { IsNotEmpty, IsString } from 'class-validator';

export class GetCrawlDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
