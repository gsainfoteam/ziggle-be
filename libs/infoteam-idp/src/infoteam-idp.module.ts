import { Module } from '@nestjs/common';
import { InfoteamIdpService } from './infoteam-idp.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [InfoteamIdpService],
  exports: [InfoteamIdpService],
})
export class InfoteamIdpModule {}
