import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { randomUUID, type UUID } from 'crypto';
import {
  BALANCE_RESET_QUEUE,
  RESET_BALANCES_JOB,
  RESET_BALANCES_MANUAL_JOB_ID_PREFIX,
  RESET_BALANCES_REMOVE_ON_COMPLETE,
  RESET_BALANCES_REMOVE_ON_FAIL,
  RESET_BALANCES_REPEAT_INTERVAL,
  RESET_BALANCES_REPEAT_JOB_ID,
} from 'src/common/consts/balance-reset.constants';
import { ResetBalancesResponseDto } from './dto/balance-reset.dto';
import type { IResetBalancesJobData } from 'src/common/interfaces/balance-reset.interface';
import type { Job, JobOptions, Queue } from 'bull';

@Injectable()
export class BalanceResetService implements OnModuleInit {
  private readonly _logger = new Logger(BalanceResetService.name);

  constructor(
    @InjectQueue(BALANCE_RESET_QUEUE)
    private readonly _resetQueue: Queue<IResetBalancesJobData>
  ) {}

  private _getManualJobOptions(): JobOptions {
    return {
      jobId: `${RESET_BALANCES_MANUAL_JOB_ID_PREFIX}:${randomUUID()}`,
      removeOnComplete: RESET_BALANCES_REMOVE_ON_COMPLETE,
      removeOnFail: RESET_BALANCES_REMOVE_ON_FAIL,
    };
  }

  private _getRepeatJobOptions(): JobOptions {
    return {
      jobId: RESET_BALANCES_REPEAT_JOB_ID,
      repeat: {
        every: RESET_BALANCES_REPEAT_INTERVAL,
      },
      removeOnComplete: RESET_BALANCES_REMOVE_ON_COMPLETE,
      removeOnFail: RESET_BALANCES_REMOVE_ON_FAIL,
    };
  }

  private async _addResetJob(
    data: IResetBalancesJobData,
    options: JobOptions
  ): Promise<Job<IResetBalancesJobData>> {
    return await this._resetQueue.add(RESET_BALANCES_JOB, data, options);
  }

  async onModuleInit(): Promise<void> {
    const job = await this._addResetJob(
      {
        source: 'repeat',
      },
      this._getRepeatJobOptions()
    );

    this._logger.log(`Repeat balance reset job registered: ${job.id}`);
  }

  async resetBalances(userId: UUID): Promise<ResetBalancesResponseDto> {
    const job = await this._addResetJob(
      {
        source: 'manual',
        requestedBy: userId,
      },
      this._getManualJobOptions()
    );

    this._logger.log(`Manual balance reset job queued: ${job.id}`);

    return new ResetBalancesResponseDto(job);
  }
}
