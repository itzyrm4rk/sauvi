import { registerAs } from '@nestjs/config';
import type { Env } from './env.validation';

export const redisConfig = registerAs(
  'redis',
  (): Pick<Env, 'REDIS_URL'> => ({
    REDIS_URL: process.env.REDIS_URL ?? '',
  }),
);
