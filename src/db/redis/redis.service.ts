import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const password = this.configService.get<string>('REDIS_PASSWORD');
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', '127.0.0.1'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: password && password.trim() ? password : undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log(' Connected to Redis successfully');
    });

    this.client.on('error', (err) => {
      this.logger.error('❌ Redis Connection Error:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async get<T = string>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch {
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = 86400,
  ): Promise<void> {
    try {
      const payload =
        typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value);
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Failed to set cache for key ${key}: ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Failed to delete cache for key ${key}: ${err}`);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      this.logger.warn(`Failed to increment key ${key}: ${err}`);
      return 0;
    }
  }

  trackClick(id: string): void {
    void this.client
      .pipeline()
      .incr(`clicks:${id}`)
      .sadd('dirty_clicks', id)
      .exec()
      .catch((err: unknown) => {
        this.logger.warn(`Failed to track click for URL ${id}: ${String(err)}`);
      });
  }

  async ackFlushedClicks(id: string, count: number): Promise<number> {
    try {
      const result = await this.client.eval(
        `
          local remaining = redis.call('DECRBY', KEYS[1], ARGV[1])
          if remaining <= 0 then
            redis.call('DEL', KEYS[1])
            redis.call('SREM', KEYS[2], ARGV[2])
          end
          return remaining
        `,
        2,
        `clicks:${id}`,
        'dirty_clicks',
        String(count),
        id,
      );

      return Number(result);
    } catch (err) {
      this.logger.warn(
        `Failed to acknowledge flushed clicks for ${id}: ${err}`,
      );
      return 0;
    }
  }

  async cleanupEmptyClickCounter(id: string): Promise<void> {
    try {
      await this.client.eval(
        `
          local current = redis.call('GET', KEYS[1])
          if not current or tonumber(current) <= 0 then
            redis.call('DEL', KEYS[1])
            redis.call('SREM', KEYS[2], ARGV[1])
          end
        `,
        2,
        `clicks:${id}`,
        'dirty_clicks',
        id,
      );
    } catch (err) {
      this.logger.warn(`Failed to clean click counter for ${id}: ${err}`);
    }
  }

  async getdel(key: string): Promise<string | null> {
    try {
      return await this.client.getdel(key);
    } catch {
      return null;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch {
      return [];
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sadd(key, ...members);
    } catch {
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch {
      return [];
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.srem(key, ...members);
    } catch {
      return 0;
    }
  }
}
