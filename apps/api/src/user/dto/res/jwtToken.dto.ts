import { ApiProperty } from '@nestjs/swagger';

export class JwtToken {
  @ApiProperty({
    type: String,
    description: 'The access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ',
  })
  access_token: string;

  @ApiProperty({
    type: Boolean,
    description: 'The user consent required',
    example: false,
  })
  consent_required: boolean;
}
