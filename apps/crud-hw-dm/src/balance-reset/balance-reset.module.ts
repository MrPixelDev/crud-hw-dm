import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '@crud-hw-dm/users/users.module';
import { BalanceResetController } from './balance-reset.controller';
import { BalanceResetService } from './balance-reset.service';
import { BALANCE_RESET_QUEUE } from '@crud-hw-dm/common/consts/balance-reset.constants';
import { BalanceResetJob } from './balance-reset.job';
import { CacheModule } from '@hwdm/caching';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { cachingConfig } from './caching.config';

@Module({
  imports: [
    CacheModule,
    ConfigModule.forFeature(cachingConfig),
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(cachingConfig)],
      inject: [cachingConfig.KEY],
      useFactory: (cacheCfg: ConfigType<typeof cachingConfig>) => {
        return {
          redis: {
            host: cacheCfg.host,
            port: cacheCfg.port,
            password: cacheCfg.password,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: BALANCE_RESET_QUEUE,
    }),
    JwtModule,
    UsersModule,
  ],
  controllers: [BalanceResetController],
  providers: [BalanceResetService, BalanceResetJob],
})
export class BalanceResetModule {}
