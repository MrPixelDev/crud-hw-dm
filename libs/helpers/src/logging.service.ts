import pino from 'pino';
import { LoggerService } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyServerOptions } from 'fastify';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  REQUEST_ID_HEADER,
  REQUEST_ID_PATTERN,
} from '@crud-hw-dm/common/consts/logging.constants';

export class LoggingService implements LoggerService {
  private readonly _logger: pino.Logger;
  private readonly _requestContext = new AsyncLocalStorage<pino.Logger>();

  constructor(application: string) {
    this._logger = pino(
      {
        level: 'info',
        base: { app: application },
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      pino.destination({ dest: 1, sync: true })
    );
  }

  private _write(
    level: pino.Level,
    message: unknown,
    optionalParams: unknown[]
  ): void {
    const lastParam = optionalParams.at(-1);
    const context = typeof lastParam === 'string' ? lastParam : undefined;

    const logger = this._requestContext.getStore() ?? this._logger;

    logger[level](
      { context },
      typeof message === 'string' ? message : 'Внутренняя ошибка приложения.'
    );
  }

  getHttpOptions(): FastifyServerOptions {
    return {
      logger: false,
      requestIdHeader: false,
      genReqId: request => {
        const requestId = request.headers[REQUEST_ID_HEADER];

        return typeof requestId === 'string' &&
          REQUEST_ID_PATTERN.test(requestId)
          ? requestId
          : randomUUID();
      },
    };
  }

  configureHttp(app: NestFastifyApplication): void {
    const server = app.getHttpAdapter().getInstance();

    server.addHook('onRequest', (request, reply, done) => {
      reply.header(REQUEST_ID_HEADER, request.id);
      this._requestContext.run(
        this._logger.child({ requestId: request.id }),
        done
      );
    });

    server.addHook('onResponse', (request, reply, done) => {
      if (reply.statusCode >= 500) {
        this._logger.child({ requestId: request.id }).error(
          {
            context: 'HTTP',
            method: request.method,
            path: request.url.split('?')[0],
            statusCode: reply.statusCode,
          },
          'Ошибка обработки HTTP-запроса.'
        );
      }

      done();
    });
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this._write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this._write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this._write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this._write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this._write('trace', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this._write('fatal', message, optionalParams);
  }
}
