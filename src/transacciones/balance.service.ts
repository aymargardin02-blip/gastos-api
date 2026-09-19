import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { TipoMovimiento } from '../generated/prisma/enums.js';
import { BalanceQueryDto } from './dto/balance-query.dto.js';

@Injectable()
export class BalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(usuarioId: number, filtros: BalanceQueryDto) {
    const { desde, hasta } = filtros;

    const fecha: Prisma.DateTimeFilter = {};
    if (desde) fecha.gte = new Date(desde);
    if (hasta) fecha.lte = new Date(hasta);

    const grupos = await this.prisma.transaccion.groupBy({
      by: ['tipo'],
      where: { usuarioId, fecha: desde || hasta ? fecha : undefined },
      _sum: { monto: true },
    });

    const sumaDe = (tipo: TipoMovimiento) =>
      grupos.find((g) => g.tipo === tipo)?._sum.monto ?? new Prisma.Decimal(0);

    const ingresos = sumaDe(TipoMovimiento.INGRESO);
    const gastos = sumaDe(TipoMovimiento.GASTO);

    return {
      desde: desde ?? null,
      hasta: hasta ?? null,
      ingresos: ingresos.toFixed(2),
      gastos: gastos.toFixed(2),
      balance: ingresos.minus(gastos).toFixed(2),
    };
  }
}
