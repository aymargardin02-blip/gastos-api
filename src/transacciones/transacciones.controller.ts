import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransaccionesService } from './transacciones.service.js';
import { CrearTransaccionDto } from './dto/crear-transaccion.dto.js';

@Controller('transacciones')
@UseGuards(AuthGuard('jwt'))
export class TransaccionesController {
  constructor(private readonly transaccionesService: TransaccionesService) {}

  @Post()
  crear(
    @Req() req: { user: { id: number } },
    @Body() datos: CrearTransaccionDto,
  ) {
    return this.transaccionesService.crear(req.user.id, datos);
  }
}
