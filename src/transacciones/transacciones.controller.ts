import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransaccionesService } from './transacciones.service.js';
import { CrearTransaccionDto } from './dto/crear-transaccion.dto.js';
import { FiltrarTransaccionesDto } from './dto/filtrar-transacciones.dto.js';

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

  @Get()
  listar(
    @Req() req: { user: { id: number } },
    @Query() filtros: FiltrarTransaccionesDto,
  ) {
    return this.transaccionesService.listar(req.user.id, filtros);
  }

  @Get(':id')
  buscarUno(
    @Req() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transaccionesService.buscarUno(req.user.id, id);
  }

  @Delete(':id')
  eliminar(
    @Req() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transaccionesService.eliminar(req.user.id, id);
  }
}
