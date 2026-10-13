import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ServerKafka } from '@nestjs/microservices';
import {
  KAFKA_CONSUMER_WS,
  KAFKA_TOPICS,
} from '@crud-hw-dm/common/consts/kafka.constants';
import type { BalanceTransferredEvent } from '@crud-hw-dm/common/events/balance-transferred.event';

@Injectable()
export class KafkaListener implements OnModuleDestroy {
  private readonly _logger = new Logger(KafkaListener.name);
  constructor(
    @Inject(KAFKA_CONSUMER_WS) private readonly _notificationClient: ServerKafka
  ) {}

  async listen(
    handler: (event: BalanceTransferredEvent) => void | Promise<void>
  ): Promise<void> {
    this._notificationClient.addHandler(
      KAFKA_TOPICS.BALANCE_TRANSFERRED,
      (event: BalanceTransferredEvent) => {
        this._logger.log(`Received balance transfer event: ${event.eventId}`);

        return Promise.resolve(handler(event));
      },
      true
    );

    try {
      await this._notificationClient.listen(err => {
        if (err) {
          throw err instanceof Error
            ? err
            : new Error('Kafka listener failed to start', { cause: err });
        }
      });
      this._logger.log('Kafka consumer connected');
    } catch (e) {
      this._logger.error(e);
      await this._notificationClient.close();
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this._notificationClient.close();
  }
}
