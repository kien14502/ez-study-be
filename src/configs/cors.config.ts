import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export const corsConfig = (config: ConfigService): CorsOptions => {
  const whitelist = config
    .get<string>('CORS_WHITELIST', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: (origin: string | undefined, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  };
};
