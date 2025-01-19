import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { loginEnum, LoginType } from '../../types/login.type';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsEnum(loginEnum)
  @IsOptional()
  type?: LoginType;
}
