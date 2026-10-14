import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ShortnerService } from '../../../core/shortner/services/shortner.service';
import { CreateUrlDto } from '../../../definitions/dto/request';

@ApiTags('Shortener')
@Controller('api/v1')
export class ShortnerController {
  constructor(private readonly shortnerService: ShortnerService) {}

  /** Create a new shortened URL (Strict rate limit: 10/min) */
  @Post('shorten')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async shorten(@Body() dto: CreateUrlDto) {
    return this.shortnerService.shortenUrl(dto);
  }

  /** List shortened URLs with pagination (30/min) */
  @Get('urls')
  @Throttle({ default: { limit: 40, ttl: 60000 } })
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.shortnerService.getAllUrls(page, limit);
  }

  /** Get click analytics for a specific short code (60/min) */
  @Get('urls/:code/stats')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getStats(@Param('code') code: string) {
    return this.shortnerService.getStats(code);
  }

  /** Delete a shortened URL by numeric ID (20/min) */
  @Delete('urls/:id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.shortnerService.deleteUrl(String(id));
  }
}
