import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomConfigModule } from '@lib/custom-config';
import { InfoteamGroupsService } from './infoteam-groups.service';

@Module({
  imports: [HttpModule, CustomConfigModule],
  providers: [InfoteamGroupsService],
  exports: [InfoteamGroupsService],
})
export class InfoteamGroupsModule {}
