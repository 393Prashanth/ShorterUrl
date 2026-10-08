import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ShortnerService } from '../../../core/shortner/services/shortner.service';
import { CreateUrlDto } from '../../../definitions/dto/request';

@Controller('api/v1')
export class ShortnerController {
  constructor(private readonly shortnerService: ShortnerService) {}

  // 1. POST /api/v1/shorten -> Create Short URL
  @Post('shorten')
  @HttpCode(HttpStatus.CREATED)
  async shorten(@Body() dto: CreateUrlDto) {
    return this.shortnerService.shortenUrl(dto);
  }

  // 2. GET /api/v1/urls -> List All URLs
  @Get('urls')
  async getAll() {
    return this.shortnerService.getAllUrls();
  }

  // 3. GET /api/v1/urls/:code/stats -> Get Stats
  @Get('urls/:code/stats')
  async getStats(@Param('code') code: string) {
    return this.shortnerService.getStats(code);
  }

  // 4. DELETE /api/v1/urls/:id -> Delete URL
  @Delete('urls/:id')
  async delete(@Param('id') id: string) {
    return this.shortnerService.deleteUrl(id);
  }
}
