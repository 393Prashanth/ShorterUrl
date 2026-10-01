import { IsNotEmpty, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'Destination URL is required' })
  @IsUrl(
    { require_protocol: true },
    { message: 'Destination URL must include http:// or https://' },
  )
  originalUrl: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'Custom slug can only contain letters, numbers, hyphens, and underscores',
  })
  customSlug?: string;
}
