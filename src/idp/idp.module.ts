import { Module } from '@nestjs/common';
import { IdpService } from './idp.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [IdpService],
  exports: [IdpService],
})
export class IdpModule {}
