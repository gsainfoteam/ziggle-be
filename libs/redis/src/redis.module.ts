import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';

import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule, TerminusModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
