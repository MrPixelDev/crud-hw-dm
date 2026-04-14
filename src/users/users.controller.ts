import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { UUID } from 'crypto';
import { AllProfileRequestDto, UpdateUserDto } from './dto/profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly _usersSvc: UsersService) {}

  @UseGuards(AccessTokenGuard)
  @Get('my')
  getOwnProfile(@CurrentUser('sub') userId: UUID) {
    return this._usersSvc.getOwnProfile(userId);
  }

  @UseGuards(AccessTokenGuard)
  @Post('all')
  getAllProfiles(@Body() data: AllProfileRequestDto) {
    return this._usersSvc.getAllProfiles(data);
  }

  @UseGuards(AccessTokenGuard)
  @Post('update')
  updateUser(@CurrentUser('sub') userId: UUID, @Body() data: UpdateUserDto) {
    return this._usersSvc.updateUser(userId, data);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @Post('delete')
  deleteUser(@CurrentUser('sub') userId: UUID) {
    return this._usersSvc.deleteUser(userId, 'soft');
  }
}
