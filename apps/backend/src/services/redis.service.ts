import { Redis } from 'ioredis';
import { config } from '../config/env.js';

class RedisCacheService {
  private client: Redis | null = null;
  private isConnected = false;
  private memoryStore = new Map<string, { value: string; expiresAt: number }>();

  constructor() {
    try {
      this.client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't crash loop if Redis is not locally installed
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        console.log('✅ Connected to Redis successfully');
      }).catch(() => {
        this.isConnected = false;
        console.log('ℹ️ Local Redis server unavailable. Falling back to built-in In-Memory Cache Store.');
      });

      this.client.on('error', () => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
      console.log('ℹ️ Using In-Memory Cache Store.');
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        console.warn('Redis set error, falling back to memory store', err);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        console.warn('Redis get error, falling back to memory store', err);
      }
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        console.warn('Redis del error, falling back to memory store', err);
      }
    }

    this.memoryStore.delete(key);
  }

  async incr(key: string, ttlSeconds: number = 60): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        const multi = this.client.multi();
        multi.incr(key);
        multi.expire(key, ttlSeconds);
        const results = await multi.exec();
        const count = results?.[0]?.[1] as number;
        return typeof count === 'number' ? count : 1;
      } catch (err) {
        console.warn('Redis incr error, falling back to memory store', err);
      }
    }

    const existing = this.memoryStore.get(key);
    const now = Date.now();
    if (!existing || now > existing.expiresAt) {
      this.memoryStore.set(key, { value: '1', expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }
    const nextVal = (parseInt(existing.value, 10) || 0) + 1;
    this.memoryStore.set(key, { value: nextVal.toString(), expiresAt: existing.expiresAt });
    return nextVal;
  }
}

export const redisService = new RedisCacheService();
