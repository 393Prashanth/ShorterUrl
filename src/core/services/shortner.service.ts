import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { ShortnerRepository } from '../repositories/shortner.repository';
import { UrlEntity } from '../entities/url.entity';
import { CreateUrlDto } from '../dto/create-url.dto';

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
  async shortenUrl(dto: CreateUrlDto) {
    const { originalUrl, customSlug } = dto;
    const code = customSlug ? customSlug.trim() : nanoid(6);

    const existing = await this.shortnerRepository.findByShortCode(code);
    if (existing) {
      throw new ConflictException(
        'This custom alias or short code is already in use. Please choose another.',
      );
    }

    const record = await this.shortnerRepository.createUrl(originalUrl, code);
    return this.formatResponse(record);
  }

  // 2. Resolve Short URL & Track Click
  async getOriginalUrlAndTrack(code: string): Promise<string> {
    const record = await this.shortnerRepository.findByShortCode(code);
    if (!record) {
      throw new NotFoundException(`Short link '${code}' not found`);
    }

    await this.shortnerRepository.incrementClicks(record.id);
    return record.originalUrl;
  }

  // 3. List All URLs
  async getAllUrls() {
    const records = await this.shortnerRepository.findAll();
    return records.map((record) => this.formatResponse(record));
  }

  // 4. Get Stats for Single URL
  async getStats(code: string) {
    const record = await this.shortnerRepository.findByShortCode(code);
    if (!record) {
      throw new NotFoundException(`Short link '${code}' not found`);
    }
    return this.formatResponse(record);
  }

  // 5. Delete URL
  async deleteUrl(id: string) {
    const deleted = await this.shortnerRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`URL with id '${id}' not found`);
    }
    return { message: 'URL deleted successfully' };
  }

  private formatResponse(record: UrlEntity) {
    return {
      ...record,
      shortUrl: `${this.baseUrl}/${record.shortCode}`,
    };
  }
}
