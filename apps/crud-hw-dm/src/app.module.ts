import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ContentsModule } from './contents/contents.module';
import { FilesModule } from './providers/files.module';
import { S3Module } from './providers/s3/s3.module';
import {
  addTransactionalDataSource,
  deleteDataSourceByName,
} from 'typeorm-transactional';
import { BalanceResetModule } from './balance-reset/balance-reset.module';
import { HelpersModule } from '@hwdm/helpers';
import { Config } from '@hwdm/config';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@hwdm/caching';
import { KafkaModule } from '@kafka/kafka';

@Module({
  imports: [
    Config,
    HelpersModule,
    CacheModule,
    KafkaModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configSvc: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configSvc.get<string>('DB_HOST'),
        port: +(configSvc.get<string>('DB_PORT') ?? 5434),
        username: configSvc.get<string>('DB_USERNAME'),
        password: configSvc.get<string>('DB_PASSWORD'),
        database: configSvc.get<string>('DB_NAME'),
        entities: ['dist/**/*.entity{.ts,.js}', 'dist/**/*.entities{.ts,.js}'],
        migrations: ['@crud-hw-dm/databases/migrations/*{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: false,
        logging: true,
      }),
      dataSourceFactory: options => {
        if (!options) {
          throw new Error('Invalid TypeORM options');
        }

        deleteDataSourceByName('default');

        const dataSource = addTransactionalDataSource(new DataSource(options));

        return Promise.resolve(dataSource);
      },
    }),
    AuthModule,
    UsersModule,
    FilesModule,
    S3Module,
    ContentsModule,
    BalanceResetModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
