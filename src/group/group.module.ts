import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { GroupController } from './group.controller';
import { UserModule } from 'src/user/user.module';
import { CustomConfigModule } from 'src/config/customConfig.module';

@Module({
  imports: [PrismaModule, HttpModule, CustomConfigModule, UserModule],
  providers: [GroupService],
  exports: [GroupService],
  controllers: [GroupController],
})
export class GroupModule {}
