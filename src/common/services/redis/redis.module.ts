import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST') || 'localhost';
        const port = configService.get<number>('REDIS_PORT') || 6379;

        const redisClient = new Redis({
          host: host,
          port: port,
        });

        redisClient.on('error', (err) => {
          console.error('[ioredis] Failed to connect:', err.message);
        });

        redisClient.on('connect', () => {
          console.info(`[ioredis] Connected to Redis at ${host}:${port}`);
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
