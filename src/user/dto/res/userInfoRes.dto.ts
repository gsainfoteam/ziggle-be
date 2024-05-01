import { ApiProperty } from '@nestjs/swagger';
import { UserInfo } from 'src/idp/types/userInfo.type';

export class UserInfoRes implements UserInfo {
  @ApiProperty({
    description: 'User uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uuid: string;

  @ApiProperty({
    description: 'User email id',
    example: 'johnDoe@gm.gist.ac.kr',
  })
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User phone number',
    example: '01012345678',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Student number',
    example: '20212345',
  })
  studentNumber: string;
}
