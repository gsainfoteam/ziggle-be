import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { ConfigModule } from '@nestjs/config';
import { FcmRepository } from './fcm.repository';
import { BullModule } from '@nestjs/bull';
import { FcmConsumer } from './fcm.consumer';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({ name: 'fcm' }),
    LoggerModule,
  ],
  providers: [FcmService, FcmRepository, FcmConsumer],
  exports: [FcmService],
})
export class FcmModule {}
