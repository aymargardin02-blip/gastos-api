import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CrearCategoriaDto } from './dto/crear-categoria.dto.js';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  crear(usuarioId: number, datos: CrearCategoriaDto) {
    return this.prisma.categoria.create({
      data: {
        ...datos,
        usuarioId,
      },
    });
  }

  listar(usuarioId: number) {
    return this.prisma.categoria.findMany({
      where: { usuarioId },
    });
  }

  async actualizar(usuarioId: number, id: number, datos: ActualizarCategoriaDto) {
    try {
      return await this.prisma.categoria.update({
        where: { id, usuarioId },
        data: datos,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw error;
    }
  }

  async eliminar(usuarioId: number, id: number) {
    try {
      return await this.prisma.categoria.delete({
        where: { id, usuarioId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw error;
    }
  }
}