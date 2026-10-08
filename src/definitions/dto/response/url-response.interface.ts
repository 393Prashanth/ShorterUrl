export interface UrlResponse {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  clicks: number;
  createdAt: Date;
  lastAccessed: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
}
