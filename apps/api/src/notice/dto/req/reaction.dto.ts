import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReactionDto {
  @ApiProperty({
    example: '👍',
    description: '반응할 이모지',
    required: true,
  })
  @IsString()
  emoji!: string;
}
