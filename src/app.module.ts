import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlEntity } from './core/entities/url.entity';
import { CoreModule } from './core/core.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('PGHOST', 'localhost'),
        port: config.get<number>('PGPORT', 5432),
        username: config.get<string>('PGUSER', 'postgres'),
        password: config.get<string>('PGPASSWORD', ''),
        database: config.get<string>('PGDATABASE', 'shortner_db'),
        entities: [UrlEntity],
        synchronize: true,
      }),
    }),

    CoreModule,
    ApiModule,
  ],
})
export class AppModule {}
