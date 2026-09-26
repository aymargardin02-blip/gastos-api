import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { TiposCuentaService } from './tipos-cuenta.service.js';
import { CrearTipoCuentaDto } from './dto/crear-tipo-cuenta.dto.js';
import { ActualizarTipoCuentaDto } from './dto/actualizar-tipo-cuenta.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

// Definimos la estructura exacta que inyecta nuestro AuthGuard para evitar 'any'
interface RequestConUsuario {
  user: {
    id: number;
    email: string;
    rol: string;
  };
}

@ApiTags('Tipos de Cuenta') // Agrupa estos endpoints en Swagger
@ApiBearerAuth() // Indica a Swagger que requiere el token JWT
@UseGuards(AuthGuard('jwt')) // Protege TODA la clase: si no hay token válido, devuelve 401
@Controller('tipos-cuenta') // La ruta base será /tipos-cuenta
export class TiposCuentaController {
  constructor(private readonly tiposCuentaService: TiposCuentaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo tipo de cuenta' })
  crear(@Request() req: RequestConUsuario, @Body() datos: CrearTipoCuentaDto) {
    // req.user.id viene del token JWT, tipado correctamente
    return this.tiposCuentaService.crear(req.user.id, datos);
  }

  @Get()
  @ApiOperation({ summary: 'Listar los tipos de cuenta del usuario' })
  @ApiQuery({ name: 'incluirArchivados', required: false, type: Boolean })
  listar(
    @Request() req: RequestConUsuario,
    // Permite pasar ?incluirArchivados=true en la URL. Si no se pasa, asume false por defecto.
    @Query('incluirArchivados', new DefaultValuePipe(false), ParseBoolPipe) incluirArchivados: boolean,
  ) {
    return this.tiposCuentaService.listar(req.user.id, incluirArchivados);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar nombre de un tipo de cuenta' })
  actualizar(
    @Request() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarTipoCuentaDto,
  ) {
    return this.tiposCuentaService.actualizar(id, req.user.id, datos);
  }

  @Patch(':id/archivar')
  @ApiOperation({ summary: 'Archivar un tipo de cuenta' })
  archivar(@Request() req: RequestConUsuario, @Param('id', ParseIntPipe) id: number) {
    return this.tiposCuentaService.archivar(id, req.user.id);
  }

  @Patch(':id/desarchivar')
  @ApiOperation({ summary: 'Desarchivar un tipo de cuenta' })
  desarchivar(@Request() req: RequestConUsuario, @Param('id', ParseIntPipe) id: number) {
    return this.tiposCuentaService.desarchivar(id, req.user.id);
  }
}
