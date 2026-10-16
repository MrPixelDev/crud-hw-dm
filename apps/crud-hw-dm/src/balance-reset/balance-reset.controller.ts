import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '@crud-hw-dm/auth/guards/access-token.guard';
import { CurrentUser } from '@crud-hw-dm/auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_SCHEME } from '@crud-hw-dm/common/consts/swagger.consts';
import { BalanceResetService } from './balance-reset.service';
import { ResetBalancesResponseDto } from './dto/balance-reset.dto';
import type { UUID } from 'crypto';

@ApiTags('Баланс')
@ApiBearerAuth(SWAGGER_BEARER_SCHEME)
@Controller('balances')
export class BalanceResetController {
  constructor(private readonly _balanceResetSvc: BalanceResetService) {}

  @ApiOperation({
    summary: 'Сбросить балансы',
    description: 'Ставит задачу сброса балансов пользователей в очередь.',
  })
  @ApiAcceptedResponse({
    description: 'Задача сброса балансов поставлена в очередь.',
    type: ResetBalancesResponseDto,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AccessTokenGuard)
  @Post('reset')
  resetBalances(
    @CurrentUser('sub') userId: UUID
  ): Promise<ResetBalancesResponseDto> {
    return this._balanceResetSvc.resetBalances(userId);
  }
}
