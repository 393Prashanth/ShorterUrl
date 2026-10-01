import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { ShortnerController } from './controllers/shortner.controller';

@Module({
  imports: [CoreModule],
  controllers: [ShortnerController],
})
export class ApiModule {}
