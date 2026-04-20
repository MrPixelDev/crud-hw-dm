import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsJWT,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  normalizeEmail,
  normalizeLogin,
} from 'src/common/utilities/transformers.utility';

export class SignupDto {
  @ApiProperty({
    description: 'Уникальный логин пользователя.',
    example: 'testuser',
  })
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Transform(normalizeLogin)
  login!: string;

  @ApiProperty({
    description: 'Электронная почта пользователя.',
    example: 'testuser@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  @Transform(normalizeEmail)
  email!: string;

  @ApiProperty({
    description: 'Пароль пользователя.',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    description: 'Возраст пользователя.',
    example: 28,
  })
  @IsInt()
  @Min(1)
  @Max(150)
  age!: number;

  @ApiProperty({
    description: 'Краткое описание профиля пользователя.',
    example: 'Какой-то пользователь',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string;
}

export class SigninDto {
  @ApiProperty({
    description: 'Логин пользователя.',
    example: 'testuser',
  })
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(normalizeLogin)
  login!: string;

  @ApiProperty({
    description: 'Пароль пользователя.',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token пользователя.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.payload.signature',
  })
  @IsString()
  @IsNotEmpty()
  @IsJWT()
  refreshToken!: string;
}

export class ChangePasswordDto implements Pick<SignupDto, 'password'> {
  @ApiProperty({
    description: 'Текущий пароль пользователя.',
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    description: 'Новый пароль пользователя.',
    example: 'NewStrongPassword456!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  newPassword!: string;
}

export class TokenPairResponseDto {
  @ApiProperty({
    description: 'JWT access token для доступа к защищенным маршрутам.',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token для обновления access token.',
  })
  refreshToken!: string;
}
