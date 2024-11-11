import { Module } from '@nestjs/common';
import { CustomConfigService } from './customConfig.service';
import { ConfigModule } from '@nestjs/config';
import { validate } from '../env.validation';

@Module({
  imports: [ConfigModule.forRoot({ validate })],
  providers: [CustomConfigService],
  exports: [CustomConfigService],
})
export class CustomConfigModule {}
