import { IsString } from 'class-validator';

export class LogoutDto {
  @IsString()
  access_token: string;
}
