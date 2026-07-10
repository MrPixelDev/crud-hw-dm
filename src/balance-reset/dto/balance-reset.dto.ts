import { ApiProperty } from '@nestjs/swagger';
import type { Job } from 'bull';
import type { IResetBalancesJobData } from 'src/common/interfaces/balance-reset.interface';

export class ResetBalancesResponseDto {
  constructor(job: Job<IResetBalancesJobData>) {
    this.jobId = String(job.id);
    this.status = 'queued';
  }

  @ApiProperty({
    description: 'ID задачи сброса балансов.',
  })
  jobId!: string;

  @ApiProperty({
    description: 'Статус постановки задачи в очередь.',
    example: 'queued',
  })
  status!: 'queued';
}
