import { AppService } from './app.service';
import type { PrismaService } from './prisma/prisma.service';
import type { RedisService } from './redis/redis.service';

describe('AppService', () => {
  it('should return ok status when database and redis are connected', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const redis = {
      ping: jest.fn().mockResolvedValue('PONG'),
    } as unknown as RedisService;

    const service = new AppService(prisma, redis);
    const health = await service.getHealth();

    expect(health).toEqual({
      status: 'ok',
      database: 'connected',
      redis: 'connected',
    });
  });

  it('should report database error when prisma query fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('DB down')),
    } as unknown as PrismaService;

    const redis = {
      ping: jest.fn().mockResolvedValue('PONG'),
    } as unknown as RedisService;

    const service = new AppService(prisma, redis);
    const health = await service.getHealth();

    expect(health.database).toBe('error');
    expect(health.redis).toBe('connected');
  });
});
