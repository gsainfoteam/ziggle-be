import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

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
  @IsString()
  code!: string;

  @ApiProperty({ type: String })
  @IsString()
  code_verifier!: string;

  @ApiProperty({ type: String })
  @IsString()
  redirect_uri!: string;

  @ApiProperty({ type: String })
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
