import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { ShortnerService } from './services/shortner.service';

@Module({
  imports: [DbModule],
  providers: [ShortnerService],
  exports: [ShortnerService],
})
export class ShortnerModule {}
