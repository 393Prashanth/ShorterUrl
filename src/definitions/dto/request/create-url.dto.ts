import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'Destination URL is required' })
  @IsUrl(
    { require_protocol: true },
    { message: 'Destination URL must include http:// or https://' },
  )
  originalUrl: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Custom slug must be at least 3 characters long' })
  @MaxLength(16, { message: 'Custom slug cannot exceed 16 characters' })
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'Custom slug can only contain letters, numbers, hyphens, and underscores',
  })
  customSlug?: string;


   @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Expiration date must be a valid ISO date',
    },
  )
  expiresAt?: string;
}

