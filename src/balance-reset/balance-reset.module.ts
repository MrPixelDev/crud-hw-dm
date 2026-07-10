import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { BalanceResetController } from './balance-reset.controller';
import { BalanceResetService } from './balance-reset.service';
import { BALANCE_RESET_QUEUE } from 'src/common/consts/balance-reset.constants';
import { REDIS_DEFAULT_HOST } from 'src/common/consts/cache.constants';
import { BalanceResetJob } from './balance-reset.job';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configSvc: ConfigService) => {
        const host = configSvc.get<string>('REDIS_HOST') ?? REDIS_DEFAULT_HOST;
        const port = Number(
          configSvc.get<string | number>('REDIS_PORT') ?? 6379
        );
        const password = configSvc.get<string>('REDIS_PASSWORD');

        return {
          redis: {
            host,
            port,
            password,
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
