import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { ConfigModule } from '@nestjs/config';
import { FcmRepository } from './fcm.repository';

@Module({
  imports: [ConfigModule],
  providers: [FcmService, FcmRepository],
  exports: [FcmService],
})
export class FcmModule {}
