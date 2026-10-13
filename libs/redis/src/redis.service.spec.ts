import Redis from 'ioredis';
import { mock } from 'jest-mock-extended';
import { CustomConfigService } from '@lib/custom-config';
import { CacheNotFoundException } from './exceptions/cacheNotFound.exception';
import { RedisService } from './redis.service';

jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let client: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.mocked(Redis).mockClear();
    service = new RedisService(
      mock<CustomConfigService>({ REDIS_HOST: 'localhost', REDIS_PORT: 6379 }),
    );
    client = jest.mocked(Redis).mock.instances[0] as jest.Mocked<Redis>;
  });

  it('connects to the configured host', () => {
    expect(Redis).toHaveBeenCalledWith('redis://localhost:6379');
  });

  it('stores values as JSON with prefix and ttl', async () => {
    await service.set('key', { a: 1 }, { prefix: 'p', ttl: 60 });

    expect(client.set).toHaveBeenCalledWith('p:key', '{"a":1}', 'EX', 60);
  });

  it('uses the default prefix', async () => {
    await service.set('key', 'v', { ttl: 60 });

    expect(client.set).toHaveBeenCalledWith('default:key', '"v"', 'EX', 60);
  });

  it('parses stored JSON values', async () => {
    client.get.mockResolvedValue('{"a":1}');

    await expect(service.get('key', { prefix: 'p' })).resolves.toEqual({
      a: 1,
    });
    expect(client.get).toHaveBeenCalledWith('p:key');
  });

  it('returns null for missing keys', async () => {
    client.get.mockResolvedValue(null);

    await expect(service.get('key', {})).resolves.toBeNull();
  });

  it('getOrThrow throws CacheNotFoundException for missing keys', async () => {
    client.get.mockResolvedValue(null);

    await expect(service.getOrThrow('key', {})).rejects.toThrow(
      CacheNotFoundException,
    );
  });

  it('deletes a prefixed key', async () => {
    await service.del('key', { prefix: 'p' });

    expect(client.del).toHaveBeenCalledWith('p:key');
  });
});
