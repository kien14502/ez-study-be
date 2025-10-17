import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis.Redis) {}

  /**
   * Set a key-value pair with optional TTL (in seconds)
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<string> {
    return this.redisClient.set(key, value, 'EX', ttlSeconds);
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  /**
   * Get TTL of a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return await this.redisClient.keys(pattern);
  }
}
