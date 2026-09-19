import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CrearTransaccionDto } from './dto/crear-transaccion.dto.js';
import { ActualizarTransaccionDto } from './dto/actualizar-transaccion.dto.js';
import { FiltrarTransaccionesDto } from './dto/filtrar-transacciones.dto.js';
import { Prisma } from '../generated/prisma/client.js';
import { TipoMovimiento } from '../generated/prisma/enums.js';

@Injectable()
export class TransaccionesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarCategoria(
    usuarioId: number,
    categoriaId: number,
    tipo: TipoMovimiento,
  ) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, usuarioId },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (categoria.tipo !== tipo) {
      throw new BadRequestException(
        'El tipo de la transacción no coincide con el de la categoría',
      );
    }
  }

  async crear(usuarioId: number, datos: CrearTransaccionDto) {
    await this.validarCategoria(usuarioId, datos.categoriaId, datos.tipo);

    return this.prisma.transaccion.create({
      data: {
        ...datos,
        fecha: new Date(datos.fecha),
        usuarioId,
      },
    });
  }

  async listar(usuarioId: number, filtros: FiltrarTransaccionesDto) {
    const { tipo, categoriaId, desde, hasta, pagina = 1, limite = 20 } = filtros;

    const fecha: Prisma.DateTimeFilter = {};
    if (desde) fecha.gte = new Date(desde);
    if (hasta) fecha.lte = new Date(hasta);

    const where: Prisma.TransaccionWhereInput = {
      usuarioId,
      tipo,
      categoriaId,
      fecha: desde || hasta ? fecha : undefined,
    };

    const [datos, total] = await Promise.all([
      this.prisma.transaccion.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.transaccion.count({ where }),
    ]);

    return {
      datos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  async buscarUno(usuarioId: number, id: number) {
    const transaccion = await this.prisma.transaccion.findFirst({
      where: { id, usuarioId },
    });

    if (!transaccion) {
      throw new NotFoundException('Transacción no encontrada');
    }

    return transaccion;
  }

  async actualizar(usuarioId: number, id: number, datos: ActualizarTransaccionDto) {
    const actual = await this.buscarUno(usuarioId, id);

    if (datos.tipo !== undefined || datos.categoriaId !== undefined) {
      const tipoFinal = datos.tipo ?? actual.tipo;
      const categoriaIdFinal = datos.categoriaId ?? actual.categoriaId;
      await this.validarCategoria(usuarioId, categoriaIdFinal, tipoFinal);
    }

    return this.prisma.transaccion.update({
      where: { id, usuarioId },
      data: {
        ...datos,
        fecha: datos.fecha ? new Date(datos.fecha) : undefined,
      },
    });
  }

  async eliminar(usuarioId: number, id: number) {
    try {
      return await this.prisma.transaccion.delete({
        where: { id, usuarioId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Transacción no encontrada');
      }
      throw error;
    }
  }
}
