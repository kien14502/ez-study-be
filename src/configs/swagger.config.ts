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
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    },
    'access-token',
  )
  .build();

export const setupSwagger = (app: INestApplication) => {
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });
  SwaggerModule.setup('api-docs', app, document);
};
