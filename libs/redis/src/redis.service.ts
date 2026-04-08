import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { CacheNotFoundException } from './exceptions/cacheNotFound.exception';
import { CacheConfig } from './types/cacheConfig.type';
import { CustomConfigService } from '@lib/custom-config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly customConfigService: CustomConfigService) {
    this.redisClient = new Redis(
      `redis://${customConfigService.REDIS_HOST}:${customConfigService.REDIS_PORT}`,
    );
  }

  async ping(): Promise<'PONG'> {
    return this.redisClient.ping();
  }

  async set<T>(
    key: string,
    value: T,
    { prefix = 'default', ttl }: CacheConfig,
  ): Promise<void> {
    this.logger.log(`Setting cache for key: ${key}`);
    await this.redisClient.set(
      `${prefix}:${key}`,
      JSON.stringify(value),
      'PX',
      ttl,
    );
  }

  async get<T>(
    key: string,
    { prefix = 'default' }: Pick<CacheConfig, 'prefix'>,
  ): Promise<T | null> {
    this.logger.log(`Getting cache for key: ${key}`);
    const value = await this.redisClient.get(`${prefix}:${key}`);
    return value ? (JSON.parse(value) as T) : null;
  }

  async getOrThrow<T>(
    key: string,
    { prefix = 'default' }: Pick<CacheConfig, 'prefix'>,
  ): Promise<T> {
    const value = await this.get<T>(key, { prefix });
    if (!value) {
      this.logger.debug(`Cache not found for key: ${key}`);
      throw new CacheNotFoundException(`${prefix}:${key}`);
    }
    return value;
  }

  async del(
    key: string,
    { prefix = 'default' }: Pick<CacheConfig, 'prefix'>,
  ): Promise<void> {
    this.logger.log(`Deleting cache for key: ${key}`);
    await this.redisClient.del(`${prefix}:${key}`);
  }

  async delByPattern(
    keyPattern: string,
    { prefix = 'default' }: Pick<CacheConfig, 'prefix'>,
  ): Promise<void> {
    const pattern = `${prefix}:${keyPattern}`;
    this.logger.log(`Deleting cache by pattern: ${pattern}`);

    const scanCount = 500;
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        scanCount,
      );

      if (keys.length) {
        await this.redisClient.del(...keys);
      }

      cursor = nextCursor;
    } while (cursor !== '0');
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
