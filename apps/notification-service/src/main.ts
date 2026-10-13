import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    NotificationServiceModule,
    new FastifyAdapter()
  );

  await app.listen(3001);
}
void bootstrap();
