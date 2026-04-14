import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  RefreshTokenDto,
  SigninDto,
  SignupDto,
} from './dto/auth.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { UUID } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(private readonly _authSvc: AuthService) {}

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this._authSvc.signup(signupDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() signinDto: SigninDto) {
    return this._authSvc.signin(signinDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this._authSvc.refresh(refreshTokenDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @Post('changepw')
  changePassword(
    @CurrentUser('login') login: string,
    @Body() newPasswordDto: ChangePasswordDto
  ) {
    return this._authSvc.changePassword(login, newPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @Post('signout')
  signout(@CurrentUser('sub') userId: UUID) {
    return this._authSvc.signout(userId);
  }
}
