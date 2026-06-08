import type Redis from 'ioredis';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  it('should ping redis when client is available', async () => {
    const mockClient = {
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
    } as unknown as Redis;

    const service = new RedisService(mockClient);
    const result = await service.ping();

    expect(result).toBe('PONG');
    expect(mockClient.ping).toHaveBeenCalledTimes(1);
  });
});
