import type { UUID } from 'crypto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  Validate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AtLeastOneField } from 'src/common/utilities/validators.utility';
import { SignupDto } from 'src/auth/dto/auth.dto';
import { UserFilter } from 'src/common/interfaces/user.interface';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Публичный UUID пользователя.',
  })
  userId!: UUID;

  @ApiProperty({
    description: 'Логин пользователя.',
  })
  login!: string;

  @ApiProperty({
    description: 'Электронная почта пользователя.',
  })
  email!: string;

  @ApiProperty({
    description: 'Возраст пользователя.',
  })
  age!: number;

  @ApiProperty({
    description: 'Описание профиля пользователя.',
  })
  description!: string;

  @ApiProperty({
    description: 'Дата создания профиля.',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Дата последнего обновления профиля.',
  })
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
  @ApiPropertyOptional({
    description: 'Логин для фильтрации профилей.',
    example: 'testuser',
  })
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
  @ApiPropertyOptional({
    description: 'Номер страницы.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Размер страницы.',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Фильтр по логину.',
    type: () => UserFilterDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserFilterDto)
  filter?: UserFilterDto;
}

export class AllProfileResponseDto {
  @ApiProperty({
    description: 'Список найденных профилей.',
    type: () => ProfileResponseDto,
    isArray: true,
  })
  users!: ProfileResponseDto[];

  @ApiProperty({
    description: 'Общее количество найденных профилей.',
  })
  total!: number;

  @ApiProperty({
    description: 'Текущая страница выдачи.',
  })
  page!: number;

  @ApiProperty({
    description: 'Количество элементов на странице.',
  })
  limit!: number;

  @ApiProperty({
    description: 'Общее количество страниц.',
  })
  totalPages!: number;

  constructor(
    users: UserEntity[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  ) {
    this.users = users.map(user => new ProfileResponseDto(user));
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = totalPages;
  }
}

export class UpdateUserDto implements Partial<
  Omit<SignupDto, 'login' | 'email' | 'password'>
> {
  @ApiPropertyOptional({
    description: 'Новый возраст пользователя.',
    example: 29,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(150)
  age?: number;

  @ApiPropertyOptional({
    description: 'Новое описание профиля пользователя.',
    example: 'Люблю NestJS, TypeORM и PostgreSQL',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description?: string;

  @Validate(AtLeastOneField, ['age', 'description'])
  private readonly _atLeastOneFieldCheck?: never;
}
