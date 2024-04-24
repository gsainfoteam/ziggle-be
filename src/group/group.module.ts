import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [GroupService],
})
export class GroupModule {}
