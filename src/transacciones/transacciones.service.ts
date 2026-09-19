import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CrearTransaccionDto } from './dto/crear-transaccion.dto.js';

@Injectable()
export class TransaccionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuarioId: number, datos: CrearTransaccionDto) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: datos.categoriaId, usuarioId },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (categoria.tipo !== datos.tipo) {
      throw new BadRequestException(
        'El tipo de la transacción no coincide con el de la categoría',
      );
    }

    return this.prisma.transaccion.create({
      data: {
        ...datos,
        fecha: new Date(datos.fecha),
        usuarioId,
      },
    });
  }
}
