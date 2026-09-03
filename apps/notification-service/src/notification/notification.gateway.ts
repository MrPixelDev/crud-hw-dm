/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Caching } from '@hwdm/helpers';
import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

enum WS_MESSAGES {
  testmessage = 'testmessage',
}

@WebSocketGateway(80, { namespace: 'messages' })
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly _logger = new Logger(NotificationGateway.name);

  constructor(private readonly _cacheManager: Caching) {}

  @WebSocketServer()
  io: Server;

  afterInit(server: Server) {
    this._logger.log(
      `Websockets Initialized ${JSON.stringify(server.eventNames(), null, 2)}`
    );
  }

  handleConnection(client: Socket) {
    const { sockets } = this.io.sockets;

    this._logger.log(`Client id: ${client.id} connected`);
    this._logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    this._logger.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage(WS_MESSAGES.testmessage)
  handleMessage(@MessageBody('id') data: string): string {
    return data;
  }
}
