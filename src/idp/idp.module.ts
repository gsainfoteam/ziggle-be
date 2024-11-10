import { Module } from '@nestjs/common';
import { IdpService } from './idp.service';
import { HttpModule } from '@nestjs/axios';
import { CustomConfigModule } from 'src/config/customConfig.module';

@Module({
  imports: [HttpModule, CustomConfigModule],
  providers: [IdpService],
  exports: [IdpService],
})
export class IdpModule {}
