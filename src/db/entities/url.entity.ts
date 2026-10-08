import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('urls')
export class UrlEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'original_url', type: 'text' })
  originalUrl: string;

  @Column({ name: 'short_code', type: 'varchar', length: 16, unique: true })
  shortCode: string;

  @Column({ name: 'clicks', type: 'int', default: 0 })
  clicks: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'last_accessed', type: 'timestamp', nullable: true })
  lastAccessed: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
