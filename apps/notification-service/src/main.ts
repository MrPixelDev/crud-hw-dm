import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { LoggingService } from '@hwdm/helpers';

const logger = new LoggingService('notification-service');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    NotificationServiceModule,
    new FastifyAdapter(logger.getHttpOptions()),
    { logger, abortOnError: false }
  );

  logger.configureHttp(app);

  await app.listen(3001);
}
void bootstrap();
