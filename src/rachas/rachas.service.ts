import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

interface DiaLocal {
  año: number;
  mes: number;
  dia: number;
}

@Injectable()
export class RachasService {
  constructor(private readonly prisma: PrismaService) {}

  private obtenerDiaLocal(
    fecha: Date,
    zonaHoraria: string,
  ): DiaLocal {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: zonaHoraria,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(fecha);

    const obtenerParte = (tipo: string) => {
      const parte = partes.find((item) => item.type === tipo);

      if (!parte) {
        throw new Error(
          `No se pudo obtener la parte "${tipo}" de la fecha`,
        );
      }

      return Number(parte.value);
    };

    return {
      año: obtenerParte('year'),
      mes: obtenerParte('month'),
      dia: obtenerParte('day'),
    };
  }

  private convertirADiaComparable(dia: DiaLocal): number {
    return Date.UTC(dia.año, dia.mes - 1, dia.dia);
  }

  private obtenerDiferenciaDias(
    anterior: DiaLocal,
    actual: DiaLocal,
  ): number {
    const milisegundosPorDia = 24 * 60 * 60 * 1000;

    return (
      (this.convertirADiaComparable(actual) -
        this.convertirADiaComparable(anterior)) /
      milisegundosPorDia
    );
  }

  private obtenerRachaActual(
    diasRegistrados: DiaLocal[],
    hoy: DiaLocal,
  ): number {
    if (diasRegistrados.length === 0) {
      return 0;
    }

    const ultimoDia =
      diasRegistrados[diasRegistrados.length - 1];

    const diasDesdeUltimoRegistro = this.obtenerDiferenciaDias(
      ultimoDia,
      hoy,
    );

    if (diasDesdeUltimoRegistro > 1) {
      return 0;
    }

    let rachaActual = 1;

    for (let i = diasRegistrados.length - 1; i > 0; i -= 1) {
      const diferencia = this.obtenerDiferenciaDias(
        diasRegistrados[i - 1],
        diasRegistrados[i],
      );

      if (diferencia !== 1) {
        break;
      }

      rachaActual += 1;
    }

    return rachaActual;
  }

  private obtenerMejorRacha(
    diasRegistrados: DiaLocal[],
  ): number {
    if (diasRegistrados.length === 0) {
      return 0;
    }

    let mejorRacha = 1;
    let rachaActual = 1;

    for (let i = 1; i < diasRegistrados.length; i += 1) {
      const diferencia = this.obtenerDiferenciaDias(
        diasRegistrados[i - 1],
        diasRegistrados[i],
      );

      if (diferencia === 1) {
        rachaActual += 1;
      } else {
        rachaActual = 1;
      }

      mejorRacha = Math.max(mejorRacha, rachaActual);
    }

    return mejorRacha;
  }

  async recalcular(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        zonaHoraria: true,
      },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const transacciones = await this.prisma.transaccion.findMany({
      where: {
        usuarioId,
        registradaEn: {
          not: null,
        },
      },
      select: {
        registradaEn: true,
      },
      orderBy: {
        registradaEn: 'asc',
      },
    });

    const diasRegistrados: DiaLocal[] = [];

    for (const transaccion of transacciones) {
      if (!transaccion.registradaEn) {
        continue;
      }

      const dia = this.obtenerDiaLocal(
        transaccion.registradaEn,
        usuario.zonaHoraria,
      );

      const ultimoDia =
        diasRegistrados[diasRegistrados.length - 1];

      if (
        ultimoDia &&
        this.obtenerDiferenciaDias(ultimoDia, dia) === 0
      ) {
        continue;
      }

      diasRegistrados.push(dia);
    }

    const hoy = this.obtenerDiaLocal(
      new Date(),
      usuario.zonaHoraria,
    );

    const rachaExistente = await this.prisma.racha.findUnique({
      where: { usuarioId },
      select: {
        mejorRacha: true,
      },
    });

    if (diasRegistrados.length === 0) {
      return this.prisma.racha.upsert({
        where: { usuarioId },
        create: {
          usuarioId,
          rachaActual: 0,
          mejorRacha: rachaExistente?.mejorRacha ?? 0,
          ultimoDiaRegistro: null,
        },
        update: {
          rachaActual: 0,
          ultimoDiaRegistro: null,
        },
      });
    }

    const rachaActual = this.obtenerRachaActual(
      diasRegistrados,
      hoy,
    );

    const mejorRachaCalculada =
      this.obtenerMejorRacha(diasRegistrados);

    const mejorRacha = Math.max(
      rachaExistente?.mejorRacha ?? 0,
      mejorRachaCalculada,
    );

    const ultimoDia =
      diasRegistrados[diasRegistrados.length - 1];

    const ultimoDiaRegistro = new Date(
      Date.UTC(
        ultimoDia.año,
        ultimoDia.mes - 1,
        ultimoDia.dia,
      ),
    );

    return this.prisma.racha.upsert({
      where: { usuarioId },
      create: {
        usuarioId,
        rachaActual,
        mejorRacha,
        ultimoDiaRegistro,
      },
      update: {
        rachaActual,
        mejorRacha,
        ultimoDiaRegistro,
      },
    });
  }

  async obtener(usuarioId: number) {
    const racha = await this.prisma.racha.findUnique({
      where: { usuarioId },
      select: {
        rachaActual: true,
        mejorRacha: true,
        ultimoDiaRegistro: true,
      },
    });

    if (racha) {
      return racha;
    }

    return {
      rachaActual: 0,
      mejorRacha: 0,
      ultimoDiaRegistro: null,
    };
  }
}
