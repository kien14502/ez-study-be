import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ErrorResponseDto } from '@/common/dto/error.response.dto';

export const setupSwagger = (app: INestApplication) => {
  const configService = app.get(ConfigService);
  const serverUrl = configService.get<string>('APP_URL') || 'http://localhost:4000';

  const config = new DocumentBuilder()
    .setTitle('EZ Study API')
    .setDescription('The EZ Study API description')
    .setVersion('1.0')
    .addTag('ez-study')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .setLicense('Doc json', `${serverUrl}/api-docs-json`)
    .addServer(serverUrl, 'Current environment')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      jsonDocumentUrl: 'api-docs-json',
      useRequestParameters: true,
    },
  });
};
