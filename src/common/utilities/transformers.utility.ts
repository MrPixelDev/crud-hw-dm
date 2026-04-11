import { isUserFilter, UserFilter } from 'src/common/interfaces/user.interface';
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

// Very bad. Need to know how with type guards
export const normalizeUsersFilter = ({
  value,
}: {
  value: unknown;
}): Partial<UserFilter> => {
  if (isUserFilter(value)) {
    for (const k in value) {
      if (typeof value[k] === 'string') {
        value[k] = value[k].toLowerCase().replace(/\s/g, '');
      }
    }
    return value;
  }
  return {};
};
