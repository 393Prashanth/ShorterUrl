import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { DbModule } from '../db/db.module';
import { ShortnerController } from './v1/shortner/shortner.controller';
import { RedirectController } from './redirect.controller';

@Module({
  imports: [CoreModule, DbModule],
  controllers: [ShortnerController, RedirectController],
})
export class ApiModule {}
