import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BalanceService } from './balance.service.js';
import { BalanceQueryDto } from './dto/balance-query.dto.js';

@ApiTags('balance')
@ApiBearerAuth()
@Controller('balance')
@UseGuards(AuthGuard('jwt'))
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  obtener(
    @Req() req: { user: { id: number } },
    @Query() filtros: BalanceQueryDto,
  ) {
    return this.balanceService.obtener(req.user.id, filtros);
  }
}
