/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';

import { S3Lib } from '../../common/consts/s3.constants';
import { S3Service } from './s3.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    S3Service,
    {
      provide: S3Lib,
      inject: [ConfigService],
      useFactory: (configSvc: ConfigService) => {
        return new AWS.S3({
          endpoint: 'http://127.0.0.1:10000',
          region: 'ru-central1',
          credentials: {
            accessKeyId: configSvc.get<string>('S3_ACCESSKEYID') as string,
            secretAccessKey: configSvc.get<string>(
              'S3_SECRETACCESSKEY'
            ) as string,
          },
        });
      },
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
