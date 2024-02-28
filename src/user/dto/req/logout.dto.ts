import { IsJWT, IsString } from 'class-validator';

export class LogoutDto {
  @IsString()
  @IsJWT()
  access_token: string;
}
