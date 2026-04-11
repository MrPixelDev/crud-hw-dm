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
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Transform(normalizeLogin)
  login!: string;

  @IsEmail()
  @MaxLength(255)
  @Transform(normalizeEmail)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;

  @IsInt()
  @Min(1)
  @Max(150)
  age!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string;
}

export class SigninDto {
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(normalizeLogin)
  login!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @IsJWT()
  refreshToken!: string;
}
