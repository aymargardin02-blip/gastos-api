import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { TipoMovimiento } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma.service.js';
import { CrearPresupuestoDto } from './dto/crear-presupuesto.dto.js';
import { ActualizarPresupuestoDto } from './dto/actualizar-presupuesto.dto.js';

type EstadoPresupuesto = 'NORMAL' | 'CERCA' | 'EXCEDIDO';

@Injectable()
export class PresupuestosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    usuarioId: number,
    datos: CrearPresupuestoDto,
  ) {
    const tiposActivos = await this.prisma.presupuesto.findMany({
      where: {
        usuarioId,
        activo: true,
      },
      select: {
        tipo: true,
      },
    });

    if (
      tiposActivos.some(
        (presupuesto) => presupuesto.tipo === datos.tipo,
      )
    ) {
      throw new ConflictException(
        `Ya tienes un presupuesto ${datos.tipo.toLowerCase()} activo`,
      );
    }

    if (tiposActivos.length >= 2) {
      throw new ConflictException(
        'No puedes tener más de dos presupuestos activos',
      );
    }

    const categoriaIds = datos.limites.map(
      (limite) => limite.categoriaId,
    );

    const categoriaIdsUnicos = new Set(categoriaIds);

    if (categoriaIdsUnicos.size !== categoriaIds.length) {
      throw new BadRequestException(
        'No puedes repetir una categoría dentro del presupuesto',
      );
    }

    const categorias = await this.prisma.categoria.findMany({
      where: {
        id: {
          in: categoriaIds,
        },
        usuarioId,
      },
      select: {
        id: true,
        tipo: true,
      },
    });

    if (categorias.length !== categoriaIdsUnicos.size) {
      throw new NotFoundException(
        'Una o más categorías no fueron encontradas',
      );
    }

    const categoriasNoGasto = categorias.filter(
      (categoria) => categoria.tipo !== TipoMovimiento.GASTO,
    );

    if (categoriasNoGasto.length > 0) {
      throw new BadRequestException(
        'Los presupuestos solo pueden utilizar categorías de gastos',
      );
    }

    return this.prisma.presupuesto.create({
      data: {
        usuarioId,
        tipo: datos.tipo,
        limites: {
          create: datos.limites.map((limite) => ({
            categoriaId: limite.categoriaId,
            limite: limite.limite,
          })),
        },
      },
      include: {
        limites: {
          include: {
            categoria: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });
  }

  async listar(usuarioId: number) {
    const presupuestos = await this.prisma.presupuesto.findMany({
      where: {
        usuarioId,
      },
      orderBy: {
        creadoEn: 'asc',
      },
      include: {
        limites: {
          include: {
            categoria: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    return Promise.all(
      presupuestos.map((presupuesto) =>
        this.agregarResumen(
          usuarioId,
          presupuesto,
        ),
      ),
    );
  }

  async obtener(usuarioId: number, id: number) {
    const presupuesto = await this.prisma.presupuesto.findFirst({
      where: {
        id,
        usuarioId,
      },
      include: {
        limites: {
          include: {
            categoria: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!presupuesto) {
      throw new NotFoundException(
        'Presupuesto no encontrado',
      );
    }

    return this.agregarResumen(
      usuarioId,
      presupuesto,
    );
  }

  async actualizarLimite(
    usuarioId: number,
    presupuestoId: number,
    categoriaId: number,
    datos: ActualizarPresupuestoDto,
  ) {
    const presupuesto =
      await this.prisma.presupuesto.findFirst({
        where: {
          id: presupuestoId,
          usuarioId,
        },
        select: {
          id: true,
          tipo: true,
          activo: true,
          limites: {
            where: {
              categoriaId,
            },
            select: {
              id: true,
              limite: true,
            },
          },
        },
      });

    if (!presupuesto) {
      throw new NotFoundException(
        'Presupuesto no encontrado',
      );
    }

    if (!presupuesto.activo) {
      throw new ConflictException(
        'No puedes modificar un presupuesto inactivo',
      );
    }

    const limiteActual = presupuesto.limites[0];

    if (!limiteActual) {
      throw new NotFoundException(
        'La categoría no pertenece a este presupuesto',
      );
    }

    const categoria = await this.prisma.categoria.findFirst({
      where: {
        id: categoriaId,
        usuarioId,
        tipo: TipoMovimiento.GASTO,
      },
      select: {
        id: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException(
        'Categoría de gasto no encontrada',
      );
    }

    const periodo = this.obtenerPeriodoActual(
      presupuesto.tipo,
    );

    const gasto = await this.prisma.transaccion.aggregate({
      where: {
        usuarioId,
        tipo: TipoMovimiento.GASTO,
        categoriaId,
        fecha: {
          gte: periodo.desde,
          lt: periodo.hasta,
        },
      },
      _sum: {
        monto: true,
      },
    });

    const gastado = gasto._sum.monto ?? new Prisma.Decimal(0);
    const limiteActualDecimal = limiteActual.limite;

    if (
      gastado.greaterThanOrEqualTo(
        limiteActualDecimal,
      )
    ) {
      throw new ConflictException(
        'No puedes modificar el límite porque la categoría ya alcanzó o superó el límite actual',
      );
    }

    if (
      new Prisma.Decimal(datos.limite).lessThan(gastado)
    ) {
      throw new BadRequestException(
        'El nuevo límite no puede ser menor que lo que ya has gastado en esta categoría',
      );
    }

    return this.prisma.limitePresupuesto.update({
      where: {
        id: limiteActual.id,
      },
      data: {
        limite: datos.limite,
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async cambiarEstado(
    usuarioId: number,
    id: number,
    activo: boolean,
  ) {
    const presupuesto = await this.prisma.presupuesto.findFirst({
      where: {
        id,
        usuarioId,
      },
    });

    if (!presupuesto) {
      throw new NotFoundException(
        'Presupuesto no encontrado',
      );
    }

    if (activo && !presupuesto.activo) {
      const activos = await this.prisma.presupuesto.count({
        where: {
          usuarioId,
          activo: true,
        },
      });

      if (activos >= 2) {
        throw new ConflictException(
          'No puedes tener más de dos presupuestos activos',
        );
      }

      const mismoTipo = await this.prisma.presupuesto.findFirst({
        where: {
          usuarioId,
          tipo: presupuesto.tipo,
          activo: true,
          id: {
            not: id,
          },
        },
      });

      if (mismoTipo) {
        throw new ConflictException(
          `Ya tienes un presupuesto ${presupuesto.tipo.toLowerCase()} activo`,
        );
      }
    }

    return this.prisma.presupuesto.update({
      where: {
        id,
      },
      data: {
        activo,
      },
    });
  }

  private async agregarResumen(
    usuarioId: number,
    presupuesto: {
      id: number;
      usuarioId: number;
      tipo: 'MENSUAL' | 'QUINCENAL';
      activo: boolean;
      creadoEn: Date;
      actualizadoEn: Date;
      limites: Array<{
        id: number;
        presupuestoId: number;
        categoriaId: number;
        limite: Prisma.Decimal;
        categoria: {
          id: number;
          nombre: string;
        };
      }>;
    },
  ) {
    const periodo = this.obtenerPeriodoActual(
      presupuesto.tipo,
    );

    const categoriaIds = presupuesto.limites.map(
      (limite) => limite.categoriaId,
    );

    if (categoriaIds.length === 0) {
      return {
        ...presupuesto,
        periodo: {
          desde: periodo.desde,
          hasta: periodo.hasta,
        },
        limites: [],
      };
    }

    const gastos = await this.prisma.transaccion.groupBy({
      by: ['categoriaId'],
      where: {
        usuarioId,
        tipo: TipoMovimiento.GASTO,
        categoriaId: {
          in: categoriaIds,
        },
        fecha: {
          gte: periodo.desde,
          lt: periodo.hasta,
        },
      },
      _sum: {
        monto: true,
      },
    });

    const gastosPorCategoria = new Map(
      gastos.map((gasto) => [
        gasto.categoriaId,
        gasto._sum.monto ?? new Prisma.Decimal(0),
      ]),
    );

    return {
      ...presupuesto,
      periodo: {
        desde: periodo.desde,
        hasta: periodo.hasta,
      },
      limites: presupuesto.limites.map(
        (limite) => {
          const gastado =
            gastosPorCategoria.get(limite.categoriaId) ??
            new Prisma.Decimal(0);

          const disponible =
            new Prisma.Decimal(limite.limite).minus(gastado);

          const porcentaje =
            gastado
              .dividedBy(limite.limite)
              .times(100)
              .toDecimalPlaces(2)
              .toNumber();

          return {
            ...limite,
            gastado: gastado.toFixed(2),
            disponible: disponible.toFixed(2),
            porcentaje,
            estado: this.obtenerEstado(
              porcentaje,
            ),
          };
        },
      ),
    };
  }

  private obtenerEstado(
    porcentaje: number,
  ): EstadoPresupuesto {
    if (porcentaje >= 100) {
      return 'EXCEDIDO';
    }

    if (porcentaje >= 80) {
      return 'CERCA';
    }

    return 'NORMAL';
  }

  private obtenerPeriodoActual(
    tipo: 'MENSUAL' | 'QUINCENAL',
  ) {
    const ahora = new Date();

    const año = ahora.getUTCFullYear();
    const mes = ahora.getUTCMonth();
    const dia = ahora.getUTCDate();

    if (tipo === 'MENSUAL') {
      return {
        desde: new Date(
          Date.UTC(año, mes, 1),
        ),
        hasta: new Date(
          Date.UTC(año, mes + 1, 1),
        ),
      };
    }

    if (dia <= 15) {
      return {
        desde: new Date(
          Date.UTC(año, mes, 1),
        ),
        hasta: new Date(
          Date.UTC(año, mes, 16),
        ),
      };
    }

    return {
      desde: new Date(
        Date.UTC(año, mes, 16),
      ),
      hasta: new Date(
        Date.UTC(año, mes + 1, 1),
      ),
    };
  }
}
