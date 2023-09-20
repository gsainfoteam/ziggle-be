import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FcmToken } from '../entity/fcmToken.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([FcmToken])],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
