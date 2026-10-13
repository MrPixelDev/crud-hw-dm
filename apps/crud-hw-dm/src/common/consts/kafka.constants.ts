export const KAFKA_PRODUCER_USERSSERVICE = Symbol(
  'KAFKA_PRODUCER_USERSSERVICE'
);
export const KAFKA_CONSUMER_WS = Symbol('KAFKA_CONSUMER_WS');

export const KAFKA_DEFAULT_BROKERS = 'localhost:9092';
export const KAFKA_PRODUCER_USERSSERVICE_CLIENT_ID = 'hwdm-usersservice';
export const KAFKA_CONSUMER_WS_CLIENT_ID = 'notification';
export const KAFKA_CONSUMER_WS_GROUP_ID = 'ws-notification-consumer';

export enum KAFKA_TOPICS {
  BALANCE_TRANSFERRED = 'users.balance-transferred.v1',
}
