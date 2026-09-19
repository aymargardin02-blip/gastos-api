import { Module } from '@nestjs/common';
import { TransaccionesController } from './transacciones.controller.js';
import { TransaccionesService } from './transacciones.service.js';
import { BalanceController } from './balance.controller.js';
import { BalanceService } from './balance.service.js';

@Module({
  controllers: [TransaccionesController, BalanceController],
  providers: [TransaccionesService, BalanceService],
})
export class TransaccionesModule {}
