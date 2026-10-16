import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import type { Kafka } from 'kafkajs';
import {
  KAFKA_PRODUCER_USERSSERVICE,
  KAFKA_TOPICS,
} from '@crud-hw-dm/common/consts/kafka.constants';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaService implements OnApplicationBootstrap {
  private readonly _logger = new Logger(KafkaService.name);
  constructor(
    @Inject(KAFKA_PRODUCER_USERSSERVICE)
    private readonly _hwdmClient: ClientKafka
  ) {}

  private async _createTopics(): Promise<void> {
    const admin = this._hwdmClient.unwrap<Kafka>().admin();

    await admin.connect();

    try {
      const existingTopics = await admin.listTopics();
      const topics = Object.values(KAFKA_TOPICS)
        .filter(topic => !existingTopics.includes(topic))
        .map(topic => ({ topic }));

      if (topics.length) {
        await admin.createTopics({
          topics,
          waitForLeaders: true,
        });
      }
    } catch (e) {
      this._logger.error(e);
    } finally {
      await admin.disconnect();
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    await this._hwdmClient.connect();
    await this._createTopics();
    this._logger.log('Kafka producer connected');
  }

  async publish<T>(topic: string, key: string, payload: T): Promise<void> {
    await firstValueFrom(
      this._hwdmClient.emit(topic, {
        key,
        value: payload,
      })
    );
  }
}
