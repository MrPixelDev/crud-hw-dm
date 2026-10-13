import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './common/swagger/swagger.config';
import fastifyMultipart from '@fastify/multipart';
import { MAX_AVATAR_FILE_SIZE_BYTES } from './common/consts/contents.consts';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';
import { LoggingService } from '@hwdm/helpers';

const logger = new LoggingService('crud-hw-dm');

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(logger.getHttpOptions()),
    { logger, abortOnError: false }
  );

  logger.configureHttp(app);

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: MAX_AVATAR_FILE_SIZE_BYTES,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
