import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { HelpersModule } from '@hwdm/helpers';

@Module({
  providers: [NotificationGateway],
  imports: [HelpersModule],
})
export class NotificationModule {}
