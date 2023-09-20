import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'code must be string' })
  @IsNotEmpty()
  code: string;
}
