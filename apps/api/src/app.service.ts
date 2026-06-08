import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

interface HealthStatus {
  status: string;
  database: string;
  redis: string;
}

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getHealth(): Promise<HealthStatus> {
    let database = 'disconnected';
    let redis = 'disconnected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      database = 'error';
    }

    try {
      const pong = await this.redis.ping();
      redis = pong === 'PONG' ? 'connected' : 'error';
    } catch {
      redis = 'error';
    }

    return {
      status: 'ok',
      database,
      redis,
    };
  }
}
