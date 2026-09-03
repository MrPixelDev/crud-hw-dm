import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CACHE_TTL } from '@crud-hw-dm/common/consts/cache.constants';
import cacheConfig from './cache.config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule.forFeature(cacheConfig)],
      inject: [cacheConfig.KEY],
      useFactory: (cacheCfg: ConfigType<typeof cacheConfig>) => {
        return {
          stores: [
            new Keyv({
              store: new KeyvRedis(
                `redis://:${cacheCfg.password}@${cacheCfg.host}:${cacheCfg.port}`
              ),
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
