import { Global, Module } from '@nestjs/common';
import { ClientsModule, ServerKafka } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import {
  KAFKA_PRODUCER_USERSSERVICE,
  KAFKA_PRODUCER_USERSSERVICE_CLIENT_ID,
  KAFKA_CONSUMER_WS,
  KAFKA_CONSUMER_WS_CLIENT_ID,
  KAFKA_CONSUMER_WS_GROUP_ID,
} from '@crud-hw-dm/common/consts/kafka.constants';
import {
  createKafkaConsumerOptions,
  createKafkaProducerOptions,
} from './kafka.config';
import { KafkaListener } from './kafka.listener';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_PRODUCER_USERSSERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) =>
          createKafkaProducerOptions(
            cfg,
            KAFKA_PRODUCER_USERSSERVICE_CLIENT_ID
          ),
      },
    ]),
  ],
  providers: [
    KafkaService,
    KafkaListener,
    {
      provide: KAFKA_CONSUMER_WS,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        new ServerKafka(
          createKafkaConsumerOptions(
            cfg,
            KAFKA_CONSUMER_WS_CLIENT_ID,
            KAFKA_CONSUMER_WS_GROUP_ID
          ).options ?? {}
        ),
    },
  ],
  exports: [KafkaService, KafkaListener],
})
export class KafkaModule {}
