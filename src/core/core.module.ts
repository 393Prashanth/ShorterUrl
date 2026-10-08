import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ShortnerModule } from './shortner/shortner.module';

@Module({
  imports: [DbModule, ShortnerModule],
  exports: [ShortnerModule],
})
export class CoreModule {}
