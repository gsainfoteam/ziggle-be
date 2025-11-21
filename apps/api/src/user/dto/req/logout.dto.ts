import { IsString } from 'class-validator';

// deprecated
export class LogoutDto {
  @IsString()
  access_token: string;
}
