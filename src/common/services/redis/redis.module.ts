import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const host = configService.get<string>('REDIS_HOST') || 'localhost';
        const port = configService.get<number>('REDIS_PORT') || 6379;

        const redisClient = new Redis({
          host: host,
          port: port,
        });

        redisClient.on('error', (err) => {
          logger.error(`Failed to connect to Redis: ${err.message}`, err.stack);
        });

        redisClient.on('connect', () => {
          logger.log(`Connected to Redis at ${host}:${port}`);
        });

        return redisClient;
      },
      inject: [ConfigService],
    },

    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
