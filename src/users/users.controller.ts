import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { UUID } from 'crypto';
import {
  AddMoneyRequestDto,
  AllProfileRequestDto,
  GetAgesRangeDto,
  ProfileResponseDto,
  ProfilesResponseDto,
  TransferMoneyRequestDto,
  UpdateUserDto,
} from './dto/profile.dto';
import { SWAGGER_BEARER_SCHEME } from 'src/common/consts/swagger.consts';

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
    type: ProfilesResponseDto,
  })
  @UseGuards(AccessTokenGuard)
  @Post('all')
  getAllProfiles(@Body() data: AllProfileRequestDto) {
    return this._usersSvc.getAllProfiles(data);
  }

  @ApiOperation({
    summary: 'Список наиболее активных пользователей',
    description:
      'Возвращает список пользователей с >2 аватарок, с описанием и с возрасом в переданном промежутке',
  })
  @ApiOkResponse({
    description: 'Список профилей получен.',
    type: ProfilesResponseDto,
  })
  @UseGuards(AccessTokenGuard)
  @Get('most-active')
  getMostActiveUsers(@Query() req: GetAgesRangeDto) {
    if (req.from > req.to) {
      throw new BadRequestException('from must be <= to');
    }
    return this._usersSvc.getMostActiveUsers([req.from, req.to]);
  }

  @ApiOperation({
    summary: 'Внести деньги пользователю.',
    description: 'Внести указанную сумму на баланс пользователя.',
  })
  @ApiOkResponse({
    description:
      'Деньги успешно зачислены. Возвращается профиль текущего пользователя с обновленным балансом.',
    type: ProfileResponseDto,
  })
  @UseGuards(AccessTokenGuard)
  @Post('addmoney')
  addBalance(
    @CurrentUser('sub') userId: UUID,
    @Body() data: AddMoneyRequestDto
  ) {
    return this._usersSvc.addMoney(userId, data);
  }

  @ApiOperation({
    summary: 'Перевести деньги пользователю.',
    description:
      'Переводит указанную сумму с баланса текущего пользователя на баланс другого пользователя.',
  })
  @ApiOkResponse({
    description:
      'Перевод успешно выполнен. Возвращается профиль текущего пользователя с обновленным балансом.',
    type: ProfileResponseDto,
  })
  @UseGuards(AccessTokenGuard)
  @Post('transfer')
  transferBalance(
    @CurrentUser('sub') userId: UUID,
    @Body() data: TransferMoneyRequestDto
  ) {
    if (userId === data.recipientId) {
      throw new BadRequestException('ID отправителя и получателя совпадают');
    }
    return this._usersSvc.transferMoney(userId, data);
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
