import { Module } from '@nestjs/common';
import { InfoteamIdpService } from './infoteam-idp.service';
import { HttpModule } from '@nestjs/axios';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [HttpModule, CustomConfigModule],
  providers: [InfoteamIdpService],
  exports: [InfoteamIdpService],
})
export class InfoteamIdpModule {}
