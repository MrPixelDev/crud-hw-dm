import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import {
  CACHE_TTL,
  REDIS_DEFAULT_HOST,
} from 'src/common/consts/cache.constants';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configSvc: ConfigService) => {
        const host = configSvc.get<string>('REDIS_HOST') ?? REDIS_DEFAULT_HOST;
        const port = Number(
          configSvc.get<string | number>('REDIS_PORT') ?? 6379
        );
        const password = configSvc.get<string>('REDIS_PASSWORD');

        return {
          stores: [
            new Keyv({
              store: new KeyvRedis(`redis://:${password}@${host}:${port}`),
            }),
          ],
          ttl: CACHE_TTL,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
