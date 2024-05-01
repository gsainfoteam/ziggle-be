import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, HttpModule, ConfigModule],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
