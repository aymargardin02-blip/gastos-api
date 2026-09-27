import { Module } from '@nestjs/common';
import { CuentasController } from './cuentas.controller.js';
import { CuentasService } from './cuentas.service.js';
import { PrismaModule } from '../prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CuentasController],
  providers: [CuentasService],
})
export class CuentasModule {}
