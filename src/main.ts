import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

const PORT = process.env.PORT ?? 5000;
const GLOBAL_PREFIX = process.env.APP_GLOBAL_PREFIX || 'v1'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useLogger(app.get(Logger));

  app.use(helmet());

  const whitelist = (process.env.CORS_WHITELIST ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix(GLOBAL_PREFIX, {
    exclude: [{ path: '/', method: RequestMethod.ALL }],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true, 
  }));
  await app.listen(PORT, '0.0.0.0', () => {
    console.info(`🚀 Application running at port ${PORT}`)
  })
}
bootstrap();
