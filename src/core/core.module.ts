import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlEntity } from './entities/url.entity';
import { ShortnerRepository } from './repositories/shortner.repository';
import { ShortnerService } from './services/shortner.service';

@Module({
  imports: [TypeOrmModule.forFeature([UrlEntity])],
  providers: [ShortnerRepository, ShortnerService],
  exports: [ShortnerService, ShortnerRepository],
})
export class CoreModule {}
