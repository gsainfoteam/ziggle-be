import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Injectable()
export class RedisIndicator extends HealthIndicator {
  constructor(@InjectRedis() private readonly redis: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const ping = await this.redis.ping().catch(() => {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false),
      );
    });
    const isHealthy = ping === 'PONG';
    const result = this.getStatus(key, isHealthy);
    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('Redis check failed', result);
  }
}
