import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { ICachePort } from '../../../domain/ports/outbound/cache.port';

@Injectable()
export class RedisCacheAdapter implements ICachePort, OnModuleInit, OnModuleDestroy {
  private client: RedisClient;
  private readonly logger = new Logger(RedisCacheAdapter.name);

  constructor() {
    const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    this.client = new Redis(url, { maxRetriesPerRequest: 3 });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to Redis...');
    await this.client.ping();
    this.logger.log('Connected to Redis');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from Redis...');
    await this.client.quit();
    this.logger.log('Disconnected from Redis');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;  
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const pipeline = this.client.pipeline();

    for await (const keys of stream) {
      if (keys.length > 0) {
        keys.forEach((key: string) => pipeline.del(key));
        await pipeline.exec();
      }
    }
  }
}