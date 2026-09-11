import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConfig } from '../config/redis.config';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.REDIS_URL');
        return {
          stores: [createKeyv(redisUrl ?? 'redis://localhost:6379')],
        };
      },
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const redisUrl = configService.get<string>('redis.REDIS_URL');
        const client = new Redis(redisUrl ?? 'redis://localhost:6379', {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });
        client.on('error', (err) => {
          new Logger('RedisClient').warn(`Redis connection error: ${err.message}`);
        });
        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService, CacheModule],
})
export class RedisModule {}
