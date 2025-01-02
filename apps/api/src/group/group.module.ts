import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { HttpModule } from '@nestjs/axios';
import { GroupController } from './group.controller';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    CustomConfigModule,
    UserModule,
    LoggerModule,
  ],
  providers: [GroupService],
  exports: [GroupService],
  controllers: [GroupController],
})
export class GroupModule {}
