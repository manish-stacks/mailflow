import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ALL_ENTITIES } from './entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'mysql' as const,
        host: config.get<string>('MYSQL_HOST'),
        port: +config.get<string>('MYSQL_PORT', '3306'),
        username: config.get<string>('MYSQL_USER'),
        password: config.get<string>('MYSQL_PASSWORD'),
        database: config.get<string>('MYSQL_DATABASE'),
        entities: ALL_ENTITIES,
        synchronize: false, // schema.sql is the source of truth
        timezone: 'Z',
        charset: 'utf8mb4',
        logging: config.get('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
        extra: { connectionLimit: 20 },
      }),
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
