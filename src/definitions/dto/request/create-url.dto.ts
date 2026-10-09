import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  IsNotIn,
} from 'class-validator';
import { RESERVED_SLUGS } from '../../../shared/utils';

export class CreateUrlDto {
  /**
   * Destination URL to shorten (must include http:// or https://)
   * @example https://github.com/393Prashanth/ShorterUrl
   */
  @IsNotEmpty({ message: 'Destination URL is required' })
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'Destination URL must include http:// or https://' },
  )
  originalUrl: string;

  /**
   * Optional custom alias (3-16 alphanumeric, hyphens, underscores)
   * @example my-github
   */
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Custom slug must be at least 3 characters long' })
  @MaxLength(16, { message: 'Custom slug cannot exceed 16 characters' })
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message:
      'Custom slug can only contain letters, numbers, hyphens, and underscores',
  })
  @IsNotIn(RESERVED_SLUGS, {
    message: 'Custom slug is a reserved system keyword and cannot be used',
  })
  customSlug?: string;

  /**
   * Optional expiration date in ISO 8601 format
   * @example 2026-12-31T23:59:59.000Z
   */
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Expiration date must be a valid ISO date',
    },
  )
  expiresAt?: string;
}
