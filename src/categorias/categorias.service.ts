import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    if (datos.tipo !== undefined) {
      const incoherentes = await this.prisma.transaccion.count({
        where: { categoriaId: id, usuarioId, tipo: { not: datos.tipo } },
      });

      if (incoherentes > 0) {
        throw new ConflictException(
          'No puedes cambiar el tipo: la categoría tiene transacciones de otro tipo',
        );
      }
    }

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
    const transacciones = await this.prisma.transaccion.count({
      where: { categoriaId: id, usuarioId },
    });

    if (transacciones > 0) {
      throw new ConflictException(
        `No puedes eliminar la categoría porque tiene ${transacciones} ${
          transacciones === 1 ? 'transacción' : 'transacciones'
        }`,
      );
    }

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
