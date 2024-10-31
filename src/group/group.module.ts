import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GroupController } from './group.controller';
import { UserModule } from 'src/user/user.module';
import { PrismaModule } from '@lib/prisma';

@Module({
  imports: [PrismaModule, HttpModule, ConfigModule, UserModule],
  providers: [GroupService],
  exports: [GroupService],
  controllers: [GroupController],
})
export class GroupModule {}
