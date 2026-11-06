import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JwtToken {
  @ApiProperty({
    type: String,
    description: 'The access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ',
  })
  access_token!: string;

  @ApiPropertyOptional({
    type: String,
    description: 'The refresh token, only when transport is body',
  })
  refresh_token?: string;
}
