import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

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

export class LoginReq {
  @ApiProperty({ type: String })
  @ValidateIf(sent)
  @IsString()
  code!: string;

  @ApiProperty({ type: String })
  @ValidateIf(sent)
  @IsString()
  code_verifier!: string;

  @ApiProperty({ type: String })
  @ValidateIf(sent)
  @IsString()
  redirect_uri!: string;

  @ApiProperty({ type: String })
  @ValidateIf(sent)
  @IsString()
  nonce!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  iss?: string;

  @ApiPropertyOptional({ enum: ['cookie', 'body'] })
  @IsOptional()
  @IsIn(['cookie', 'body'])
  transport?: 'cookie' | 'body';
}
