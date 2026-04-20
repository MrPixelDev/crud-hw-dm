import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';
export const SWAGGER_BEARER_SCHEME = 'access-token';

export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Документация API')
    .setDescription(
      'Локальная документация API для авторизации, профилей и проверки защищенных маршрутов.'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Передайте access token в формате Bearer <token> для защищенных методов.',
      },
      SWAGGER_BEARER_SCHEME
    )
    .build();
}

export function createSwaggerDocument(app: INestApplication) {
  return SwaggerModule.createDocument(app, createSwaggerConfig());
}

export function setupSwagger(app: INestApplication) {
  const documentFactory = () => createSwaggerDocument(app);

  SwaggerModule.setup(SWAGGER_PATH, app, documentFactory, {
    customSiteTitle: 'Документация API',
  });
}
