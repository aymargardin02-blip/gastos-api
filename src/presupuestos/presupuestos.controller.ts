import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PresupuestosService } from './presupuestos.service.js';
import { CrearPresupuestoDto } from './dto/crear-presupuesto.dto.js';
import { ActualizarPresupuestoDto } from './dto/actualizar-presupuesto.dto.js';

interface RequestConUsuario extends Request {
  user: {
    id: number;
    email: string;
    rol: string;
  };
}

@ApiTags('presupuestos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('presupuestos')
export class PresupuestosController {
  constructor(
    private readonly presupuestosService: PresupuestosService,
  ) {}

  @Post()
  crear(
    @Req() req: RequestConUsuario,
    @Body() datos: CrearPresupuestoDto,
  ) {
    return this.presupuestosService.crear(
      req.user.id,
      datos,
    );
  }

  @Get()
  listar(@Req() req: RequestConUsuario) {
    return this.presupuestosService.listar(req.user.id);
  }

  @Get(':id')
  obtener(
    @Req() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.presupuestosService.obtener(
      req.user.id,
      id,
    );
  }

  @Patch(':id/limites/:categoriaId')
  actualizarLimite(
    @Req() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
    @Param('categoriaId', ParseIntPipe) categoriaId: number,
    @Body() datos: ActualizarPresupuestoDto,
  ) {
    return this.presupuestosService.actualizarLimite(
      req.user.id,
      id,
      categoriaId,
      datos,
    );
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Req() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
    @Body('activo') activo: boolean,
  ) {
    return this.presupuestosService.cambiarEstado(
      req.user.id,
      id,
      activo,
    );
  }
}
