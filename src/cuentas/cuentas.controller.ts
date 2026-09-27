import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CuentasService } from './cuentas.service.js';
import { CrearCuentaDto } from './dto/crear-cuenta.dto.js';
import { ActualizarCuentaDto } from './dto/actualizar-cuenta.dto.js';

interface RequestConUsuario extends Request {
  user: { id: number; email: string; rol: string };
}

@ApiTags('cuentas')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('cuentas')
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  @Post()
  crear(
    @Req() req: RequestConUsuario,
    @Body() datos: CrearCuentaDto,
  ) {
    return this.cuentasService.crear(req.user.id, datos);
  }

  @Get()
  listar(
    @Req() req: RequestConUsuario,
    @Query('incluirArchivadas') incluirArchivadas?: string,
  ) {
    return this.cuentasService.listar(
      req.user.id,
      incluirArchivadas === 'true',
    );
  }

  @Get(':id/saldo')
  obtenerSaldo(
    @Req() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cuentasService.obtenerSaldo(req.user.id, id);
  }

  @Patch(':id')
  actualizar(
    @Req() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarCuentaDto,
  ) {
    return this.cuentasService.actualizar(
      id,
      req.user.id,
      datos,
    );
  }

  @Patch(':id/archivar')
  archivar(
    @Req() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cuentasService.archivar(id, req.user.id);
  }

  @Patch(':id/desarchivar')
  desarchivar(
    @Req() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cuentasService.desarchivar(id, req.user.id);
  }
}
