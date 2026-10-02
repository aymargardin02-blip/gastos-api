import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { ActualizarPrivacidadDto } from './dto/actualizar-privacidad.dto.js';

@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        perfilSocial: {
          select: {
            nombreUsuario: true,
            descripcion: true,
          },
        },
        preferenciaPrivacidad: {
          select: {
            participarRanking: true,
            mostrarRacha: true,
            perfilPublico: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async actualizarPerfil(
    usuarioId: number,
    datos: ActualizarPerfilDto,
  ) {
    const nombreUsuario = datos.nombreUsuario.toLowerCase();

    try {
      return await this.prisma.perfilSocial.upsert({
        where: { usuarioId },
        create: {
          usuarioId,
          nombreUsuario,
          descripcion: datos.descripcion,
        },
        update: {
          nombreUsuario,
          descripcion: datos.descripcion,
        },
        select: {
          nombreUsuario: true,
          descripcion: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ese nombre de usuario ya está en uso',
        );
      }

      throw error;
    }
  }

  async actualizarPrivacidad(
    usuarioId: number,
    datos: ActualizarPrivacidadDto,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.preferenciaPrivacidad.upsert({
      where: { usuarioId },
      create: {
        usuarioId,
        participarRanking: datos.participarRanking,
        mostrarRacha: datos.mostrarRacha,
        perfilPublico: datos.perfilPublico,
      },
      update: {
        participarRanking: datos.participarRanking,
        mostrarRacha: datos.mostrarRacha,
        perfilPublico: datos.perfilPublico,
      },
      select: {
        participarRanking: true,
        mostrarRacha: true,
        perfilPublico: true,
      },
    });
  }
}
