import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriasService } from './categorias.service.js';
import { CrearCategoriaDto } from './dto/crear-categoria.dto.js';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto.js';

// TODO: reemplazar por el id del usuario autenticado cuando exista JWT
const USUARIO_ID_TEMPORAL = 1;

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  crear(@Body() datos: CrearCategoriaDto) {
    return this.categoriasService.crear(USUARIO_ID_TEMPORAL, datos);
  }

  @Get()
  listar() {
    return this.categoriasService.listar(USUARIO_ID_TEMPORAL);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarCategoriaDto,
  ) {
    return this.categoriasService.actualizar(USUARIO_ID_TEMPORAL, id, datos);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.eliminar(USUARIO_ID_TEMPORAL, id);
  }
}