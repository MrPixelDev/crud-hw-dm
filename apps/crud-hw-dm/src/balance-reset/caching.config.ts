import { registerAs } from '@nestjs/config';
import { REDIS_DEFAULT_HOST } from '@crud-hw-dm/common/consts/cache.constants';

export const cachingConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? REDIS_DEFAULT_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
}));

export type CachingConfig = ReturnType<typeof cachingConfig>;
