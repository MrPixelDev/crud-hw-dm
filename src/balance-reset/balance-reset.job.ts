import { Process, Processor } from '@nestjs/bull';
import { UsersService } from 'src/users/users.service';
import { Logger } from '@nestjs/common';
import {
  BALANCE_RESET_QUEUE,
  RESET_BALANCES_JOB,
} from 'src/common/consts/balance-reset.constants';
import type { Job } from 'bull';
import type { IResetBalancesJobData } from 'src/common/interfaces/balance-reset.interface';

@Processor(BALANCE_RESET_QUEUE)
export class BalanceResetJob {
  private readonly _logger = new Logger(BalanceResetJob.name);

  constructor(private readonly _usersSvc: UsersService) {}

  @Process(RESET_BALANCES_JOB)
  async resetBalances(job: Job<IResetBalancesJobData>): Promise<boolean> {
    this._logger.log(
      `Balance reset job started: ${job.id}, source=${job.data.source}`
    );

    try {
      await this._usersSvc.resetBalances();

      this._logger.log(`Balance reset job completed: ${job.id}`);

      return true;
    } catch (e) {
      this._logger.error(
        `Balance reset job failed: ${job.id}`,
        e instanceof Error ? e.stack : undefined
      );
      throw e;
    }
  }
}
