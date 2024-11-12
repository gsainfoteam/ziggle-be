import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { FcmRepository } from './fcm.repository';
import { BullModule } from '@nestjs/bull';
import { FcmConsumer } from './fcm.consumer';
import { CustomConfigModule } from 'src/config/customConfig.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [
    CustomConfigModule,
    PrismaModule,
    BullModule.registerQueue({ name: 'fcm' }),
    LoggerModule,
  ],
  providers: [FcmService, FcmRepository, FcmConsumer],
  exports: [FcmService],
})
export class FcmModule {}
