import { Module } from '@nestjs/common';
import { TransaccionesController } from './transacciones.controller.js';
import { TransaccionesService } from './transacciones.service.js';

@Module({
  controllers: [TransaccionesController],
  providers: [TransaccionesService],
})
export class TransaccionesModule {}
