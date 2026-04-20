import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import {
  AllProfileRequestDto,
  AllProfileResponseDto,
  ProfileResponseDto,
  UpdateUserDto,
} from './dto/profile.dto';
import { SWAGGER_BEARER_SCHEME } from 'src/common/swagger/swagger.config';

@ApiTags('Профиль')
@ApiBearerAuth(SWAGGER_BEARER_SCHEME)
@Controller('profile')
export class ProfileController {
  constructor(private readonly _usersSvc: UsersService) {}

  @ApiOperation({
    summary: 'Получить свой профиль',
    description: 'Возвращает публичные данные текущего пользователя.',
  })
  @ApiOkResponse({
    description: 'Профиль пользователя получен.',
    type: ProfileResponseDto,
  })
  @UseGuards(AccessTokenGuard)
  @Get('my')
  getOwnProfile(@CurrentUser('sub') userId: UUID) {
    return this._usersSvc.getOwnProfile(userId);
  }

  @ApiOperation({
    summary: 'Получить список профилей',
    description:
      'Возвращает пагинированный список профилей с фильтрацией по логину.',
  })
  @ApiOkResponse({
    description: 'Список профилей получен.',
    type: AllProfileResponseDto,
  })
  @UseGuards(AccessTokenGuard)
  @Post('all')
  getAllProfiles(@Body() data: AllProfileRequestDto) {
    return this._usersSvc.getAllProfiles(data);
  }

  @ApiOperation({
    summary: 'Обновить профиль',
    description: 'Обновляет доступные поля профиля текущего пользователя.',
  })
  @ApiOkResponse({
    description: 'Профиль пользователя обновлен.',
    type: ProfileResponseDto,
  })
  @UseGuards(AccessTokenGuard)
  @Post('update')
  updateUser(@CurrentUser('sub') userId: UUID, @Body() data: UpdateUserDto) {
    return this._usersSvc.updateUser(userId, data);
  }

  @ApiOperation({
    summary: 'Удалить профиль',
    description:
      'Выполняет мягкое удаление пользователя и отзывает активные сеансы.',
  })
  @ApiOkResponse({
    description: 'Профиль пользователя удален.',
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @Post('delete')
  deleteUser(@CurrentUser('sub') userId: UUID) {
    return this._usersSvc.deleteUser(userId, 'soft');
  }
}
