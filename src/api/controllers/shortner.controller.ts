import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { ShortnerService } from '../../core/services/shortner.service';
import { CreateUrlDto } from '../../core/dto/create-url.dto';

@Controller()
export class ShortnerController {
  constructor(private readonly shortnerService: ShortnerService) {}

  // 1. POST /api/shorten -> Create Short URL
  @Post('api/shorten')
  @HttpCode(HttpStatus.CREATED)
  async shorten(@Body() dto: CreateUrlDto) {
    return this.shortnerService.shortenUrl(dto);
  }

  // 2. GET /api/urls -> List All URLs
  @Get('api/urls')
  async getAll() {
    return this.shortnerService.getAllUrls();
  }

  // 3. GET /api/urls/:code/stats -> Get Stats
  @Get('api/urls/:code/stats')
  async getStats(@Param('code') code: string) {
    return this.shortnerService.getStats(code);
  }

  // 4. DELETE /api/urls/:id -> Delete URL
  @Delete('api/urls/:id')
  async delete(@Param('id') id: string) {
    return this.shortnerService.deleteUrl(id);
  }

  // 5. GET /:code -> 302 Redirection & Click Tracking
  @Get(':code')
  async redirect(@Param('code') code: string, @Res() res: Response) {
    const originalUrl = await this.shortnerService.getOriginalUrlAndTrack(code);
    return res.redirect(HttpStatus.FOUND, originalUrl);
  }
}
