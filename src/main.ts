import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import ConfigKey from './common/config-key';
import { TransformInterceptor } from './common/core/tranform.interceptor';
import { setupSwagger } from './configs/swagger.config';

const PORT = process.env.PORT ?? 5000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.useLogger(app.get(Logger));

  app.use(helmet());

  const whitelist = (process.env.CORS_WHITELIST ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const appGlobalPrefix = configService.get(ConfigKey.APP_GLOBAL_PREFIX) ?? '/api';
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
  setupSwagger(app);
  await app.listen(PORT, '0.0.0.0', () => {
    console.info(`🚀 Application running at port ${PORT}`);
  });
}
bootstrap();
