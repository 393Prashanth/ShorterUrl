import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ShortnerService } from '../core/shortner/services/shortner.service';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(private readonly shortnerService: ShortnerService) {}

  // Handles both root (http://localhost:5000/:code) and versioned (http://localhost:5000/api/v1/:code)
  @Get([':code', 'api/v1/:code'])
  async redirect(@Param('code') code: string, @Res() res: Response) {
    // Ignore browser/system metadata or api root requests
    if (code === 'favicon.ico' || code === 'robots.txt' || code === 'api') {
      throw new NotFoundException();
    }

    const originalUrl = await this.shortnerService.getOriginalUrlAndTrack(code);
    return res.redirect(HttpStatus.FOUND, originalUrl);
  }
}
