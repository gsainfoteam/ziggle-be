import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomConfigModule } from '@lib/custom-config';
import { InfoteamGroupsService } from './infoteam-groups.service';
import { GroupsGuard } from './guard/groups.guard';
import { GroupsStrategy } from './guard/groups.strategy';

@Module({
  imports: [HttpModule, CustomConfigModule],
  providers: [InfoteamGroupsService, GroupsGuard, GroupsStrategy],
  exports: [InfoteamGroupsService, GroupsGuard],
})
export class InfoteamGroupsModule {}
