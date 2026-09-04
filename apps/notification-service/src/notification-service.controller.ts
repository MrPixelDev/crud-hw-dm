import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationGateway } from './notification/notification.gateway';
import { AccessTokenGuard } from '@crud-hw-dm/auth/guards/access-token.guard';

@Controller()
export class NotificationServiceController {
  constructor(private readonly _notificationGateway: NotificationGateway) {}

  @UseGuards(AccessTokenGuard)
  @Post('notification')
  sendNotification(@Body('login') login: string): void {
    return this._notificationGateway.sendNotification(login);
  }
}
