import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { ShortnerModule } from './shortner/shortner.module';
import { ShortnerService } from './shortner/services/shortner.service';

@Module({
  imports: [DbModule, ShortnerModule],
  providers: [ShortnerService],
  exports: [ShortnerModule, ShortnerService],
})
export class CoreModule {}
