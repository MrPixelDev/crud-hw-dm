/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IAccessTokenPayload } from '@crud-hw-dm/common/interfaces/auth.interface';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

const WS_MESSAGES = {
  notification: 'notification',
};

@WebSocketGateway(8082, { namespace: 'messages' })
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly _logger = new Logger(NotificationGateway.name);
  constructor(
    private readonly _configSvc: ConfigService,
    @Inject(JwtService) private readonly _jwtService: JwtService
  ) {}

  @WebSocketServer()
  io: Server;

  afterInit(server: Server) {
    this._logger.log(
      `Websockets Initialized ${JSON.stringify(server.eventNames(), null, 2)}`
    );
  }

  handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization;
    this._logger.log(
      `token: ${token}\n\nJWT SECRET: ${this._configSvc.get<string>('JWT_ACCESS_SECRET')}`
    );
    if (!token) {
      this._logger.warn('No authorization header presented.');
      client.disconnect();
      return;
    }

    try {
      const jwt = this._jwtService.verify<IAccessTokenPayload>(
        token.replace('Bearer ', ''),
        {
          secret: this._configSvc.get<string>('JWT_ACCESS_SECRET'),
        }
      );
      console.log(jwt.login);
      void client.join(jwt.login);
      console.log(client.rooms);
    } catch (e: any) {
      console.log(e);
      client.disconnect();
      return;
    }

    this._logger.log(`Client id: ${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    this._logger.log(`Cliend id:${client.id} disconnected`);
  }

  sendNotification(login: string) {
    console.log(login);
    this.io.to(login).emit(WS_MESSAGES.notification, {
      data: 'Notif!',
    });
  }
}
