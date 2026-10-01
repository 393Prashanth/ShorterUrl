import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // 1. Load environment variables globally from .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configure TypeORM asynchronously using ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('PGHOST', 'localhost'),
        port: config.get<number>('PGPORT', 5432),
        username: config.get<string>('PGUSER', 'postgres'),
        password: config.get<string>('PGPASSWORD', 'Prashanth@77'),
        database: config.get<string>('PGDATABASE', 'shortner_db'),
        autoLoadEntities: true, // Automatically loads all entities without manual imports
        synchronize: true,      // Automatically syncs DB schema (for local development only)
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}