import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { HttpModule } from '@nestjs/axios';
import { GroupController } from './group.controller';
import { UserModule } from 'src/user/user.module';
import { CustomConfigModule } from 'src/config/customConfig.module';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';

@Module({
  imports: [PrismaModule, HttpModule, CustomConfigModule, UserModule, LoggerModule],
  providers: [GroupService],
  exports: [GroupService],
  controllers: [GroupController],
})
export class GroupModule {}
