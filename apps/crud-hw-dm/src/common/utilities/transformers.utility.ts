import { BadRequestException } from '@nestjs/common';

export const normalizeLogin = ({ value }: { value: unknown }): string => {
  if (typeof value !== 'string') {
    throw new BadRequestException('Login must be a string');
  }

  return value.trim();
};

export const normalizeEmail = ({ value }: { value: unknown }): string => {
  if (typeof value !== 'string') {
    throw new BadRequestException('Email must be a string');
  }

  return value.toLowerCase();
};
