import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LoginType, loginEnum } from 'src/user/types/login.type';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsEnum(loginEnum)
  @IsOptional()
  type?: LoginType;
}
