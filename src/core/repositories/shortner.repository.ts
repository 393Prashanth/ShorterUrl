import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrlEntity } from '../entities/url.entity';

@Injectable()
export class ShortnerRepository {
  constructor(
    @InjectRepository(UrlEntity)
    private readonly repo: Repository<UrlEntity>,
  ) {}

  async findByShortCode(shortCode: string): Promise<UrlEntity | null> {
    return this.repo.findOne({ where: { shortCode } });
  }

  async createUrl(originalUrl: string, shortCode: string): Promise<UrlEntity> {
    const url = this.repo.create({ originalUrl, shortCode });
    return this.repo.save(url);
  }

  async incrementClicks(id: string): Promise<void> {
    await this.repo.update(id, {
      clicks: () => 'clicks + 1',
      lastAccessed: new Date(),
    });
  }

  async findAll(): Promise<UrlEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
