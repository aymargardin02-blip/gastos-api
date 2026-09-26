import { Module } from '@nestjs/common';
import { TiposCuentaService } from './tipos-cuenta.service.js';
import { TiposCuentaController } from './tipos-cuenta.controller.js';
import { PrismaModule } from '../prisma.module.js';

@Module({
  imports: [PrismaModule], // Importamos Prisma para que el servicio pueda usar la base de datos
  controllers: [TiposCuentaController],
  providers: [TiposCuentaService],
})
export class TiposCuentaModule {}
