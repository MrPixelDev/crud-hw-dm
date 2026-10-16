import { Test, TestingModule } from '@nestjs/testing';
import { S3Lib } from '@crud-hw-dm/common/consts/s3.constants';

import { S3Service } from './s3.service';

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: S3Lib,
          useValue: {
            putObject: jest.fn(),
            deleteObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
