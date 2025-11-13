import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  idpAccessToken: string;
}
