import type { UUID } from 'crypto';
import type { UserFilter } from 'src/common/interfaces/user.interface';
import { UserEntity } from '../entities/user.entity';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AtLeastOneField } from 'src/common/utilities/validators.utility';
import { SignupDto } from 'src/auth/dto/auth.dto';

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

export class UpdateUserDto implements Partial<
  Omit<SignupDto, 'login' | 'email' | 'password'>
> {
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description?: string;

  @Validate(AtLeastOneField, ['age', 'description'])
  private readonly _atLeastOneFieldCheck?: never;
}
