import { registerAs } from '@nestjs/config';
import { REDIS_DEFAULT_HOST } from 'src/common/consts/cache.constants';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? REDIS_DEFAULT_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
}));
