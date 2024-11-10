import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { FcmRepository } from './fcm.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { FcmConsumer } from './fcm.consumer';
import { CustomConfigModule } from 'src/config/customConfig.module';

@Module({
  imports: [
    CustomConfigModule,
    PrismaModule,
    BullModule.registerQueue({ name: 'fcm' }),
  ],
  providers: [FcmService, FcmRepository, FcmConsumer],
  exports: [FcmService],
})
export class FcmModule {}
