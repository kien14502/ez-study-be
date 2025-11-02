import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import ConfigKey from './common/config-key';
import { TransformInterceptor } from './common/core/transform.interceptor';
import { corsConfig } from './configs/cors.config';
import { setupSwagger } from './configs/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableCors(corsConfig(configService));
  const appGlobalPrefix = configService.get(ConfigKey.APP_GLOBAL_PREFIX, '/api');
  app.setGlobalPrefix(appGlobalPrefix);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(helmet());
  setupSwagger(app);
  const PORT = configService.get<number>('PORT', 4000);
  await app.listen(PORT, '0.0.0.0', () => {
    logger.log(`🚀 Application running at port ${PORT}`);
  });
}
bootstrap();
