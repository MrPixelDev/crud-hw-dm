import {
  Body,
  Controller,
  OnApplicationBootstrap,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotificationGateway } from './notification/notification.gateway';
import { AccessTokenGuard } from '@crud-hw-dm/auth/guards/access-token.guard';
import { KafkaListener } from '@kafka/kafka';

@Controller()
export class NotificationServiceController implements OnApplicationBootstrap {
  constructor(
    private readonly _notificationGateway: NotificationGateway,
    private readonly _kafkaListener: KafkaListener
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this._kafkaListener.listen(event =>
      this._notificationGateway.sendNotification(event.toUserLogin, event)
    );
  }

  @UseGuards(AccessTokenGuard)
  @Post('notification')
  sendNotification(@Body('login') login: string): void {
    return this._notificationGateway.sendNotification(login, 'Notif!');
  }
}
