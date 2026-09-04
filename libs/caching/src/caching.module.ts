import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CACHE_TTL } from '@crud-hw-dm/common/consts/cache.constants';
import { cachingConfig } from './caching.config';
import { Caching } from './caching.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule.forFeature(cachingConfig)],
      inject: [cachingConfig.KEY],
      useFactory: (cacheCfg: ConfigType<typeof cachingConfig>) => {
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
  providers: [Caching],
  exports: [NestCacheModule, Caching],
})
export class CacheModule {}
