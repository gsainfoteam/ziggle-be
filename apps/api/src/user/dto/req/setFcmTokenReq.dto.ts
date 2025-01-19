import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class setFcmTokenReq {
  @ApiProperty({
    type: String,
    description: 'FCM token',
    example:
      '1233444444BiicOTaJd33z:1234567890C3Innd09876-a_abcdefghhh9ZMINuOWhkcQ5_m6qm8Zw4xqF1voj2up6ZV4_t2Dx1111111111zF1MDiQ1Vrpz13-1111111111Z8iSIC_hK_26htaOV2u7nbL_poPy59',
  })
  @IsString()
  fcmToken: string;
}
