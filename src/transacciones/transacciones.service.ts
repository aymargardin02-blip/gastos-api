import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CrearTransaccionDto } from './dto/crear-transaccion.dto.js';
import { ActualizarTransaccionDto } from './dto/actualizar-transaccion.dto.js';
import { FiltrarTransaccionesDto } from './dto/filtrar-transacciones.dto.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  ComponenteDeuda,
  ComportamientoCuenta,
  TipoMovimiento,
} from '../generated/prisma/enums.js';

@Injectable()
export class TransaccionesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarCategoria(
    usuarioId: number,
    categoriaId: number | null | undefined,
    tipo: TipoMovimiento,
  ) {
    if (tipo === TipoMovimiento.TRANSFERENCIA && categoriaId == null) {
      return;
    }

    if (categoriaId == null) {
      throw new BadRequestException(
        'La categoría es obligatoria para ingresos y gastos',
      );
    }

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

  private async obtenerCuentaActiva(
    usuarioId: number,
    cuentaId: number,
  ) {
    const cuenta = await this.prisma.cuenta.findFirst({
      where: {
        id: cuentaId,
        usuarioId,
        archivada: false,
      },
      include: {
        tipoCuenta: true,
      },
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    return cuenta;
  }

  private async validarCuentas(
    usuarioId: number,
    datos: CrearTransaccionDto,
  ) {
    const cuentaOrigen = await this.obtenerCuentaActiva(
      usuarioId,
      datos.cuentaId,
    );

    if (datos.tipo !== TipoMovimiento.TRANSFERENCIA) {
      if (datos.cuentaDestinoId !== undefined) {
        throw new BadRequestException(
          'cuentaDestinoId solo puede utilizarse en transferencias',
        );
      }

      if (datos.componenteDeuda !== undefined) {
        throw new BadRequestException(
          'componenteDeuda solo puede utilizarse en transferencias',
        );
      }

      return {
        cuentaOrigen,
        cuentaDestino: null,
      };
    }

    if (datos.categoriaId !== undefined) {
      throw new BadRequestException(
        'Una transferencia no puede tener categoría',
      );
    }

    if (datos.cuentaDestinoId === undefined) {
      throw new BadRequestException(
        'Una transferencia requiere una cuentaDestinoId',
      );
    }

    if (datos.cuentaDestinoId === datos.cuentaId) {
      throw new BadRequestException(
        'La cuenta de origen y la cuenta de destino deben ser diferentes',
      );
    }

    const cuentaDestino = await this.obtenerCuentaActiva(
      usuarioId,
      datos.cuentaDestinoId,
    );

    if (
      cuentaDestino.tipoCuenta.comportamiento ===
      ComportamientoCuenta.DEUDA
    ) {
      if (cuentaDestino.tieneInteres === true) {
        if (datos.componenteDeuda === undefined) {
          throw new BadRequestException(
            'Una transferencia a una deuda con intereses requiere componenteDeuda',
          );
        }
      } else if (datos.componenteDeuda !== undefined) {
        throw new BadRequestException(
          'Una deuda sin intereses no puede tener componenteDeuda',
        );
      }
    } else if (datos.componenteDeuda !== undefined) {
      throw new BadRequestException(
        'componenteDeuda solo puede utilizarse al pagar una deuda',
      );
    }

    return {
      cuentaOrigen,
      cuentaDestino,
    };
  }

  async crear(usuarioId: number, datos: CrearTransaccionDto) {
    await this.validarCategoria(
      usuarioId,
      datos.categoriaId,
      datos.tipo,
    );

    await this.validarCuentas(usuarioId, datos);

    return this.prisma.transaccion.create({
      data: {
        ...datos,
        fecha: new Date(datos.fecha),
        usuarioId,
      },
    });
  }

  async listar(
    usuarioId: number,
    filtros: FiltrarTransaccionesDto,
  ) {
    const {
      tipo,
      categoriaId,
      desde,
      hasta,
      pagina = 1,
      limite = 20,
    } = filtros;

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

  async actualizar(
    usuarioId: number,
    id: number,
    datos: ActualizarTransaccionDto,
  ) {
    const actual = await this.buscarUno(usuarioId, id);

    const tipoFinal = datos.tipo ?? actual.tipo;
    const categoriaIdFinal =
      datos.categoriaId ?? actual.categoriaId;

    const cuentaIdFinal = datos.cuentaId ?? actual.cuentaId;
    const cuentaDestinoIdFinal =
      datos.cuentaDestinoId ?? actual.cuentaDestinoId;

    const componenteDeudaFinal =
      datos.componenteDeuda ?? actual.componenteDeuda;

    await this.validarCategoria(
      usuarioId,
      categoriaIdFinal,
      tipoFinal,
    );

    await this.validarCuentas(usuarioId, {
      tipo: tipoFinal,
      monto: datos.monto ?? actual.monto.toNumber(),
      descripcion: datos.descripcion ?? actual.descripcion ?? undefined,
      fecha: datos.fecha ?? actual.fecha.toISOString(),
      categoriaId: categoriaIdFinal ?? undefined,
      cuentaId: cuentaIdFinal,
      cuentaDestinoId: cuentaDestinoIdFinal ?? undefined,
      componenteDeuda:
        componenteDeudaFinal as
          | ComponenteDeuda
          | undefined,
    });

    return this.prisma.transaccion.update({
      where: {
        id,
        usuarioId,
      },
      data: {
        ...datos,
        fecha: datos.fecha
          ? new Date(datos.fecha)
          : undefined,
      },
    });
  }

  async eliminar(usuarioId: number, id: number) {
    try {
      return await this.prisma.transaccion.delete({
        where: { id, usuarioId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'Transacción no encontrada',
        );
      }

      throw error;
    }
  }
}
