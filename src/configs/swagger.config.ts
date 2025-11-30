import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ErrorResponseDto } from '@/common/dto/error.response.dto';

const config = new DocumentBuilder()
  .setTitle('EZ Study API')
  .setDescription('The EZ Study API description')
  .setVersion('1.0')
  .addTag('ez-study')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'Bearer',
      bearerFormat: 'JWT',
      in: 'header',
    },
    'accessToken',
  )
  .setLicense('Doc json', '/api-docs-json')
  .addServer('http://localhost:4000', 'Localhost Server')
  .addServer('http://192.168.1.100:4000', 'Local Network Server')
  .build();

export const setupSwagger = (app: INestApplication) => {
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  });
};
