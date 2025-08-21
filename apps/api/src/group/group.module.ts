import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { HttpModule } from '@nestjs/axios';
import { GroupController } from './group.controller';
import { PrismaModule } from '@lib/prisma';
import { LoggerModule } from '@lib/logger';
import { CustomConfigModule } from '@lib/custom-config';
import { UserModule } from '../user/user.module';
import { GroupsGuard } from './guard/groups.guard';
import { GroupsStrategy } from './guard/groups.strategy';
import { InfoteamGroupsModule } from 'libs/infoteam-groups/src/infoteam-groups.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    CustomConfigModule,
    UserModule,
    LoggerModule,
    InfoteamGroupsModule,
  ],
  providers: [GroupService, GroupsGuard, GroupsStrategy],
  exports: [GroupService, GroupsGuard],
  controllers: [GroupController],
})
export class GroupModule {}
