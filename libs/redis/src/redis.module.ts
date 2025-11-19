import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { RedisService } from './redis.service';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [CustomConfigModule, TerminusModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
