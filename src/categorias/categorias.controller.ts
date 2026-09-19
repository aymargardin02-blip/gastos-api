import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CategoriasService } from './categorias.service.js';
import { CrearCategoriaDto } from './dto/crear-categoria.dto.js';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto.js';

interface RequestConUsuario extends Request {
  user: { id: number; email: string; rol: string };
}

@UseGuards(AuthGuard('jwt'))
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  crear(@Req() req: RequestConUsuario, @Body() datos: CrearCategoriaDto) {
    return this.categoriasService.crear(req.user.id, datos);
  }

  @Get()
  listar(@Req() req: RequestConUsuario) {
    return this.categoriasService.listar(req.user.id);
  }

  @Patch(':id')
  actualizar(
    @Req() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarCategoriaDto,
  ) {
    return this.categoriasService.actualizar(req.user.id, id, datos);
  }

  @Delete(':id')
  eliminar(@Req() req: RequestConUsuario, @Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.eliminar(req.user.id, id);
  }
}
