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
    const code = customSlug ? customSlug.trim() : nanoid(6);

    const existing = await this.shortnerRepository.findByShortCode(code);
    if (existing) {
      throw new ConflictException(
        'This custom alias or short code is already in use. Please choose another.',
      );
    }

    const record = await this.shortnerRepository.createUrl(
      originalUrl,
      code,
      expiresAt,
    );
    return this.formatResponse(record);
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

  // 3. List All URLs
  async getAllUrls(): Promise<UrlResponse[]> {
    const records = await this.shortnerRepository.findAll();
    return records.map((record) => this.formatResponse(record));
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
