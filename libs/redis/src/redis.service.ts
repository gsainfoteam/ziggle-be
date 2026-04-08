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
      'EX',
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
    const keys = await this.redisClient.keys(pattern);
    if (!keys.length) {
      return;
    }
    await this.redisClient.del(...keys);
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
