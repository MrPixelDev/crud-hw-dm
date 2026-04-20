import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  RefreshTokenDto,
  SigninDto,
  SignupDto,
  TokenPairResponseDto,
} from './dto/auth.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { UUID } from 'crypto';
import { SWAGGER_BEARER_SCHEME } from 'src/common/swagger/swagger.config';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  constructor(private readonly _authSvc: AuthService) {}

  @ApiOperation({
    summary: 'Регистрация пользователя',
    description:
      'Создает пользователя и возвращает пару access/refresh токенов.',
  })
  @ApiCreatedResponse({
    description: 'Пользователь зарегистрирован.',
    type: TokenPairResponseDto,
  })
  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this._authSvc.signup(signupDto);
  }

  @ApiOperation({
    summary: 'Вход пользователя',
    description:
      'Проверяет логин и пароль пользователя и возвращает новую пару токенов.',
  })
  @ApiOkResponse({
    description: 'Аутентификация выполнена успешно.',
    type: TokenPairResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() signinDto: SigninDto) {
    return this._authSvc.signin(signinDto);
  }

  @ApiOperation({
    summary: 'Обновление access token',
    description: 'Обновляет пару токенов по действующему refresh token.',
  })
  @ApiOkResponse({
    description: 'Пара токенов успешно обновлена.',
    type: TokenPairResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this._authSvc.refresh(refreshTokenDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_SCHEME)
  @ApiOperation({
    summary: 'Смена пароля',
    description:
      'Проверяет текущий пароль и возвращает новую пару токенов после смены пароля.',
  })
  @ApiOkResponse({
    description: 'Пароль успешно изменен.',
    type: TokenPairResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @Post('changepw')
  changePassword(
    @CurrentUser('login') login: string,
    @Body() newPasswordDto: ChangePasswordDto
  ) {
    return this._authSvc.changePassword(login, newPasswordDto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_SCHEME)
  @ApiOperation({
    summary: 'Выход пользователя',
    description: 'Отзывает активные сеансы текущего пользователя.',
  })
  @ApiOkResponse({
    description: 'Активные сеансы пользователя успешно отозваны.',
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @Post('signout')
  signout(@CurrentUser('sub') userId: UUID) {
    return this._authSvc.signout(userId);
  }
}
