import { UserInfo } from '@lib/infoteam-idp/types/userInfo.type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserInfoRes implements UserInfo {
  @ApiProperty({
    description: 'User uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uuid: string;

  @ApiProperty({
    type: String,
    description: 'User email id',
    example: 'johnDoe@gm.gist.ac.kr',
  })
  email: string | null;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User profile image',
    example: 'https://bucket.s3.ap-northeast-2.amazonaws.com/1626740269.webp',
  })
  picture: string | null;

  @ApiPropertyOptional({
    description: 'Student number',
    example: '20212345',
  })
  studentNumber?: string;

  @ApiProperty({
    description: 'Consent or not',
    example: true,
  })
  consent: boolean;
}
