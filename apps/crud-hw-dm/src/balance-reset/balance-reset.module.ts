import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '@crud-hw-dm/users/users.module';
import { BalanceResetController } from './balance-reset.controller';
import { BalanceResetService } from './balance-reset.service';
import { BALANCE_RESET_QUEUE } from '@crud-hw-dm/common/consts/balance-reset.constants';
import { BalanceResetJob } from './balance-reset.job';
import cacheConfig from '@crud-hw-dm/cache/cache.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(cacheConfig)],
      inject: [cacheConfig.KEY],
      useFactory: (cacheCfg: ConfigType<typeof cacheConfig>) => {
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
