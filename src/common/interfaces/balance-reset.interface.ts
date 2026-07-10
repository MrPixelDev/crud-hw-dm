import type { UUID } from 'crypto';

export interface IResetBalancesJobData {
  source: 'manual' | 'repeat';
  requestedBy?: UUID;
}
