import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

export function getKafkaBrokers(cfg: ConfigService): string[] {
  const cfgBrokers = cfg.get<string>('KAFKA_BROKERS');

  if (!cfgBrokers) {
    throw new Error('KAFKA_BROKERS is empty');
  }

  return cfgBrokers.split(',').map(broker => broker.trim());
}

export function createKafkaProducerOptions(
  cfg: ConfigService,
  cfgClientId: string
): KafkaOptions {
  const clientId = cfg.get<string>(cfgClientId);
  if (!clientId) {
    throw new Error(`${cfgClientId} is empty.`);
  }
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
  cfgClientId: string,
  cfgGroupId: string
): KafkaOptions {
  const clientId = cfg.get<string>(cfgClientId);
  if (!clientId) {
    throw new Error(`${cfgClientId} is empty.`);
  }
  const groupId = cfg.get<string>(cfgGroupId);
  if (!groupId) {
    throw new Error(`${cfgGroupId} is empty.`);
  }
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
