import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';
import { LoginCodeBody } from '@infoteam/account-nest/dto';

/** Old app versions log in with only an IdP access token in the Authorization header. */
const sent = (o: LoginReq) => Object.values(o).some((v) => v !== undefined);

export class SessionReq {
  @ApiPropertyOptional({
    enum: ['cookie', 'body'],
    description: 'Where the refresh token travels. Apps send body.',
  })
  @IsOptional()
  @IsIn(['cookie', 'body'])
  transport?: 'cookie' | 'body';

  @ApiPropertyOptional({ type: String, description: 'Body transport only' })
  @IsOptional()
  @IsString()
  refresh_token?: string;
}

export class LoginReq extends LoginCodeBody {
  @ValidateIf(sent)
  code!: string;

  @ValidateIf(sent)
  code_verifier!: string;

  @ValidateIf(sent)
  redirect_uri!: string;

  @ValidateIf(sent)
  nonce!: string;
}
