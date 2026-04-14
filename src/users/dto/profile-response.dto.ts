import type { UUID } from 'crypto';
import type { UserFilter } from 'src/common/interfaces/user.interface';
import { UserEntity } from '../entities/user.entity';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProfileResponseDto {
  userId!: UUID;
  login!: string;
  email!: string;
  age!: number;
  description!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(user: UserEntity) {
    this.userId = user.userId;
    this.login = user.login;
    this.email = user.email;
    this.age = user.age;
    this.description = user.description;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

export class UserFilterDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: UserFilter }) => {
    for (const key in value) {
      if (typeof value[key] === 'string') {
        value[key] = value[key].toLowerCase().replace(/\s/g, '');
      }
    }
  })
  login?: string;
}

export class AllProfileRequestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  filter?: UserFilterDto;
}

export class AllProfileResponseDto {
  users!: ProfileResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;

  constructor(
    users: UserEntity[],
    page: number,
    limit: number,
    totalPages: number
  ) {
    this.users = users;
    this.total = users.length;
    this.page = page;
    this.limit = limit;
    this.totalPages = totalPages;
  }
}
