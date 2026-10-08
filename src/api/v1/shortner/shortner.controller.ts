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
import { ShortnerService } from '../../../core/shortner/services/shortner.service';
import { CreateUrlDto } from '../../../definitions/dto/request';

@ApiTags('Shortener')
@Controller('api/v1')
export class ShortnerController {
  constructor(private readonly shortnerService: ShortnerService) {}

  /** Create a new shortened URL */
  @Post('shorten')
  @HttpCode(HttpStatus.CREATED)
  async shorten(@Body() dto: CreateUrlDto) {
    return this.shortnerService.shortenUrl(dto);
  }

  /** List shortened URLs with pagination */
  @Get('urls')
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.shortnerService.getAllUrls(page, limit);
  }

  /** Get click analytics for a specific short code */
  @Get('urls/:code/stats')
  async getStats(@Param('code') code: string) {
    return this.shortnerService.getStats(code);
  }

  /** Delete a shortened URL by numeric ID */
  @Delete('urls/:id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.shortnerService.deleteUrl(String(id));
  }
}
