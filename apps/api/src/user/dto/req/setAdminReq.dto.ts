import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetAdminReq {
  @ApiProperty({
    description: 'Whether the user has admin permission',
    example: true,
  })
  @IsBoolean()
  isAdmin!: boolean;
}
