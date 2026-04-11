import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { UUID } from 'crypto';
import { AllProfileRequestDto } from './dto/profile-response.dto';

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
  getAllProfiles(
    @CurrentUser('sub') userId: UUID,
    @Body() data: AllProfileRequestDto
  ) {
    return this._usersSvc.getAllProfiles(data);
  }
}
