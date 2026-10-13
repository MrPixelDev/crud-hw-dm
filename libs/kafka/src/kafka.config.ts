import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { KAFKA_DEFAULT_BROKERS } from '@crud-hw-dm/common/consts/kafka.constants';

export function getKafkaBrokers(cfg: ConfigService): string[] {
  const brokers = (cfg.get<string>('KAFKA_BROKERS') ?? KAFKA_DEFAULT_BROKERS)
    .split(',')
    .map(broker => broker.trim())
    .filter(Boolean);

  if (!brokers.length) {
    throw new Error('KAFKA_BROKERS is empty.');
  }

  return brokers;
}

export function createKafkaProducerOptions(
  cfg: ConfigService,
  clientId: string
): KafkaOptions {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId,
        brokers: getKafkaBrokers(cfg),
      },
      producerOnlyMode: true,
    },
  };
}

export function createKafkaConsumerOptions(
  cfg: ConfigService,
  clientId: string,
  groupId: string
): KafkaOptions {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId,
        brokers: getKafkaBrokers(cfg),
      },
      consumer: {
        groupId,
        allowAutoTopicCreation: false,
      },
      subscribe: {
        fromBeginning: true,
      },
      run: {
        autoCommit: true,
      },
    },
  };
}
