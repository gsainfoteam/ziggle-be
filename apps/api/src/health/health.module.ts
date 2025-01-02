import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '@lib/prisma';
import { CustomConfigModule } from '@lib/custom-config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisIndicator } from './indicator/redis.indicator';

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      logger: true,
    }),
    CustomConfigModule,
    PrismaModule,
    RedisModule,
  ],
  providers: [RedisIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
