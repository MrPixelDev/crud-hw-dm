import { Module } from '@nestjs/common';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationModule } from './notification/notification.module';
import { Config } from '@hwdm/config';
import { HelpersModule } from '@hwdm/helpers';
import { KafkaModule } from '@kafka/kafka';

@Module({
  imports: [NotificationModule, HelpersModule, Config, KafkaModule],
  controllers: [NotificationServiceController],
  providers: [],
})
export class NotificationServiceModule {}
