import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CrearCategoriaDto } from './dto/crear-categoria.dto.js';

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
}
