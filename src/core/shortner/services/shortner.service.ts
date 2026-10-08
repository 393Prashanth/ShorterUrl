import {
  Injectable,
  ConflictException,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { ShortnerRepository } from '../../../db/repositories';
import { UrlEntity } from '../../../db/entities';
import { CreateUrlDto } from '../../../definitions/dto/request';
import { UrlResponse } from '../../../definitions/dto/response';
import { SHORT_CODE_LENGTH } from '../../../shared/utils';

@Injectable()
export class ShortnerService {
  private readonly baseUrl: string;

  constructor(
    private readonly shortnerRepository: ShortnerRepository,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:5000';
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

  // 2. Resolve Short URL & Track Click
  async getOriginalUrlAndTrack(code: string): Promise<string> {
    const record = await this.shortnerRepository.findByShortCode(code);
    if (!record) {
      throw new NotFoundException(`Short link '${code}' not found`);
    }

    if (!record.isActive) {
      throw new GoneException('This short link is no longer active');
    }

    if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
      throw new GoneException('This short link has expired');
    }

    await this.shortnerRepository.incrementClicks(record.id);
    return record.originalUrl;
  }

  // 3. List All URLs with pagination
  async getAllUrls(page: number = 1, limit: number = 20) {
    // Sanitize values to prevent negative or overly large limits
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

  // 4. Get Stats for Single URL
  async getStats(code: string): Promise<UrlResponse> {
    const record = await this.shortnerRepository.findByShortCode(code);
    if (!record) {
      throw new NotFoundException(`Short link '${code}' not found`);
    }
    return this.formatResponse(record);
  }

  // 5. Delete URL
  async deleteUrl(id: string): Promise<{ message: string }> {
    const deleted = await this.shortnerRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`URL with id '${id}' not found`);
    }
    return { message: 'URL deleted successfully' };
  }

  private formatResponse(record: UrlEntity): UrlResponse {
    return {
      ...record,
      shortUrl: `${this.baseUrl}/${record.shortCode}`,
    };
  }
}
