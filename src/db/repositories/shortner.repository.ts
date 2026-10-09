import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrlEntity } from '../entities';

@Injectable()
export class ShortnerRepository {
  constructor(
    @InjectRepository(UrlEntity)
    private readonly repo: Repository<UrlEntity>,
  ) {}

  async findByShortCode(shortCode: string): Promise<UrlEntity | null> {
    return this.repo.findOne({ where: { shortCode } });
  }

  async findById(id: string): Promise<UrlEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async createUrl(
    originalUrl: string,
    shortCode: string,
    expiresAt?: string | Date | null,
  ): Promise<UrlEntity> {
    const url = this.repo.create({
      originalUrl,
      shortCode,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    return this.repo.save(url);
  }

  async incrementClicks(id: string): Promise<void> {
    await this.repo.update(id, {
      clicks: () => 'clicks + 1',
      lastAccessed: new Date(),
    });
  }

  async incrementClicksBy(id: string, count: number): Promise<void> {
    await this.repo.update(id, {
      clicks: () => `clicks + ${count}`,
      lastAccessed: new Date(),
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: UrlEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return { data, total };
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
