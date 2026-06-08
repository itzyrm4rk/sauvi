import { registerAs } from '@nestjs/config';
import type { Env } from './env.validation';

export const databaseConfig = registerAs(
  'database',
  (): Pick<Env, 'DATABASE_URL'> => ({
    DATABASE_URL: process.env.DATABASE_URL ?? '',
  }),
);
