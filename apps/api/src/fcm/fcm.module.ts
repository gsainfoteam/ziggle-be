import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { FcmRepository } from './fcm.repository';
import { BullModule } from '@nestjs/bull';
import { FcmConsumer } from './fcm.consumer';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    CustomConfigModule,
    PrismaModule,
    BullModule.registerQueue({ name: 'fcm' }),
    LoggerModule,
    UserModule,
  ],
  providers: [FcmService, FcmRepository, FcmConsumer],
  exports: [FcmService],
})
export class FcmModule {}
