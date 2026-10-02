import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PerfilService } from './perfil.service.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { ActualizarPrivacidadDto } from './dto/actualizar-privacidad.dto.js';

interface RequestConUsuario extends Request {
  user: { id: number; email: string; rol: string };
}

@ApiTags('perfil')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get()
  obtener(@Req() req: RequestConUsuario) {
    return this.perfilService.obtener(req.user.id);
  }

  @Patch()
  actualizarPerfil(
    @Req() req: RequestConUsuario,
    @Body() datos: ActualizarPerfilDto,
  ) {
    return this.perfilService.actualizarPerfil(req.user.id, datos);
  }

  @Patch('privacidad')
  actualizarPrivacidad(
    @Req() req: RequestConUsuario,
    @Body() datos: ActualizarPrivacidadDto,
  ) {
    return this.perfilService.actualizarPrivacidad(
      req.user.id,
      datos,
    );
  }
}
