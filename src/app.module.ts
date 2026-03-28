// import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configSvc: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configSvc.get<string>('DB_HOST'),
        port: +(configSvc.get<string>('DB_PORT') ?? 5434),
        username: configSvc.get<string>('DB_USERNAME'),
        password: configSvc.get<string>('DB_PASSWORD'),
        database: configSvc.get<string>('DB_NAME'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['src/databases/migrations/*{.ts,.js}'],
        // entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
        // migrations: [path.join(__dirname, 'migrations/**/*{.ts,.js}')],
        autoLoadEntities: true,
        synchronize: false,
        logging: true,
      }),
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
