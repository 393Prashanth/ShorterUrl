import {
  Injectable,
  ConflictException,
  NotFoundException,
  GoneException,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { ShortnerRepository } from '../../../db/repositories';
import { UrlEntity } from '../../../db/entities';
import { CreateUrlDto } from '../../../definitions/dto/request';
import { UrlResponse } from '../../../definitions/dto/response';
import { SHORT_CODE_LENGTH } from '../../../shared/utils';
import { RedisService } from '../../../db/redis/redis.service';

@Injectable()
export class ShortnerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ShortnerService.name);
  private readonly baseUrl: string;
  private syncTimer?: NodeJS.Timeout;

  constructor(
    private readonly shortnerRepository: ShortnerRepository,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:5000';
  }

  onModuleInit() {
    // ⏱️ Sync in-memory Redis clicks to PostgreSQL every 30 seconds
    this.syncTimer = setInterval(() => {
      void this.syncBufferedClicksToDb();
    }, 60_000);
  }

  async onModuleDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    // Flush remaining clicks to PostgreSQL on application shutdown
    await this.syncBufferedClicksToDb();
  }

  // 1. Create Short URL
  async shortenUrl(dto: CreateUrlDto): Promise<UrlResponse> {
    const { originalUrl, customSlug, expiresAt } = dto;

    if (customSlug) {
      const code = customSlug.trim();
      const existing = await this.shortnerRepository.findByShortCode(code);
      if (existing) {
        throw new ConflictException(
          'This custom alias is already in use. Please choose another.',
        );
      }

      try {
        const record = await this.shortnerRepository.createUrl(
          originalUrl,
          code,
          expiresAt,
        );
        return this.formatResponse(record);
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === '23505'
        ) {
          throw new ConflictException(
            'This custom alias is already in use. Please choose another.',
          );
        }
        throw error;
      }
    }

    // Auto-generate slug with collision retry
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = nanoid(SHORT_CODE_LENGTH);
      const existing = await this.shortnerRepository.findByShortCode(code);
      if (existing) {
        continue;
      }

      try {
        const record = await this.shortnerRepository.createUrl(
          originalUrl,
          code,
          expiresAt,
        );
        return this.formatResponse(record);
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === '23505' &&
          attempt < maxRetries - 1
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException(
      'Failed to generate unique short code. Please try again.',
    );
  }

  // 2. Resolve Short URL & Track Click (Concise & Protected with Negative Caching)
  async getOriginalUrlAndTrack(code: string): Promise<string> {
    const cacheKey = `url:${code}`;

    let record = await this.redisService.get<UrlEntity | 'NOT_FOUND'>(cacheKey);

    if (record === 'NOT_FOUND') {
      throw new NotFoundException(`Short link '${code}' not found`);
    }

    if (!record) {
      record = await this.shortnerRepository.findByShortCode(code);
      if (!record) {
        // Cache negative 404 for 60s to protect PostgreSQL against brute-force crawlers
        await this.redisService.set(cacheKey, 'NOT_FOUND', 60);
        throw new NotFoundException(`Short link '${code}' not found`);
      }
      await this.redisService.set(cacheKey, record, 86400);
    }

    this.validateUrlState(record);

    // Track clicks with one Redis round trip and flush them to PostgreSQL later.
    this.redisService.trackClick(record.id);
    return record.originalUrl;
  }

  // 3. List All URLs with pagination
  async getAllUrls(page: number = 1, limit: number = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const { data, total } = await this.shortnerRepository.findAll(
      safePage,
      safeLimit,
    );
    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      data: data.map((record) => this.formatResponse(record)),
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  // 4. Get Stats for Single URL (Reads PostgreSQL + In-Memory Redis Buffer)
  async getStats(code: string): Promise<UrlResponse> {
    const record = await this.shortnerRepository.findByShortCode(code);
    if (!record) {
      throw new NotFoundException(`Short link '${code}' not found`);
    }

    const bufferedClicks = await this.redisService.get<string>(
      `clicks:${record.id}`,
    );
    const totalClicks = bufferedClicks
      ? record.clicks + parseInt(bufferedClicks, 10)
      : record.clicks;

    return this.formatResponse({
      ...record,
      clicks: totalClicks,
    });
  }

  // 5. Delete URL (Purges both redirect cache and click counter from Redis)
  async deleteUrl(id: string): Promise<{ message: string }> {
    const existing = await this.shortnerRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`URL with id '${id}' not found`);
    }

    const deleted = await this.shortnerRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`URL with id '${id}' not found`);
    }

    // Purge redirect cache, click counter buffer, and dirty set from Redis
    await this.redisService.del(`url:${existing.shortCode}`);
    await this.redisService.del(`clicks:${id}`);
    await this.redisService.srem('dirty_clicks', id);

    return { message: 'URL deleted successfully' };
  }

  /** Periodically flushes buffered click counters from Redis into PostgreSQL via dirty set */
  async syncBufferedClicksToDb(): Promise<void> {
    try {
      const ids = await this.redisService.smembers('dirty_clicks');
      if (ids.length === 0) return;

      for (const id of ids) {
        const clickKey = `clicks:${id}`;
        const countValue = await this.redisService.get<string | number>(
          clickKey,
        );
        const count = Number(countValue);

        if (!Number.isInteger(count) || count <= 0) {
          await this.redisService.cleanupEmptyClickCounter(id);
          continue;
        }

        try {
          await this.shortnerRepository.incrementClicksBy(id, count);
          await this.redisService.ackFlushedClicks(id, count);
        } catch (err: unknown) {
          this.logger.error(`Failed to flush clicks for ID ${id}:`, err);
        }
      }
    } catch (err: unknown) {
      this.logger.error('Failed to sync clicks to DB:', err);
    }
  }

  private validateUrlState(record: UrlEntity): void {
    if (!record.isActive) {
      throw new GoneException('This short link is no longer active');
    }
    if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
      throw new GoneException('This short link has expired');
    }
  }

  private formatResponse(record: UrlEntity): UrlResponse {
    return {
      ...record,
      shortUrl: `${this.baseUrl}/${record.shortCode}`,
    };
  }
}
