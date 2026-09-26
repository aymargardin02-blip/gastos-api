import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import {
  ComportamientoCuenta,
  TipoMovimiento,
} from '../generated/prisma/enums.js';
import { CrearCuentaDto } from './dto/crear-cuenta.dto.js';
import { ActualizarCuentaDto } from './dto/actualizar-cuenta.dto.js';

type DatosCuentaNormalizados = {
  nombre: string;
  tipoCuentaId: number;
  limiteCredito: number | null;
  diaCorte: number | null;
  diaPago: number | null;
  tasaInteres: number | null;
  tieneInteres: boolean | null;
  montoOriginal: number | null;
  cuentaPagoId: number | null;
};

@Injectable()
export class CuentasService {
  constructor(private readonly prisma: PrismaService) {}

  private async obtenerCuentaPorIdYUsuario(id: number, usuarioId: number) {
    const cuenta = await this.prisma.cuenta.findFirst({
      where: {
        id,
        usuarioId,
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

  private async obtenerTipoCuenta(
    tipoCuentaId: number,
    usuarioId: number,
  ) {
    const tipoCuenta = await this.prisma.tipoCuenta.findFirst({
      where: {
        id: tipoCuentaId,
        usuarioId,
      },
    });

    if (!tipoCuenta) {
      throw new NotFoundException('Tipo de cuenta no encontrado');
    }

    if (tipoCuenta.archivado) {
      throw new ConflictException(
        'No se puede usar un tipo de cuenta archivado',
      );
    }

    return tipoCuenta;
  }

  private async validarCuentaPago(
    cuentaPagoId: number,
    usuarioId: number,
    cuentaActualId?: number,
  ) {
    if (cuentaActualId === cuentaPagoId) {
      throw new BadRequestException(
        'Una cuenta no puede ser su propia cuenta de pago',
      );
    }

    const cuentaPago = await this.prisma.cuenta.findFirst({
      where: {
        id: cuentaPagoId,
        usuarioId,
        archivada: false,
      },
      include: {
        tipoCuenta: true,
      },
    });

    if (!cuentaPago) {
      throw new NotFoundException('Cuenta de pago no encontrada');
    }

    return cuentaPago;
  }

  private async validarDatosPorComportamiento(
    comportamiento: ComportamientoCuenta,
    datos: DatosCuentaNormalizados,
    usuarioId: number,
    cuentaActualId?: number,
  ) {
    if (comportamiento === ComportamientoCuenta.NORMAL) {
      if (
        datos.limiteCredito !== null ||
        datos.diaCorte !== null ||
        datos.diaPago !== null ||
        datos.tasaInteres !== null ||
        datos.tieneInteres !== null ||
        datos.montoOriginal !== null ||
        datos.cuentaPagoId !== null
      ) {
        throw new BadRequestException(
          'Una cuenta NORMAL no puede tener configuración de tarjeta de crédito o deuda',
        );
      }

      return;
    }

    if (comportamiento === ComportamientoCuenta.TARJETA_CREDITO) {
      if (
        datos.limiteCredito === null ||
        datos.diaCorte === null ||
        datos.diaPago === null ||
        datos.tasaInteres === null ||
        datos.cuentaPagoId === null
      ) {
        throw new BadRequestException(
          'Una tarjeta de crédito requiere limiteCredito, diaCorte, diaPago, tasaInteres y cuentaPagoId',
        );
      }

      if (
        datos.montoOriginal !== null ||
        datos.tieneInteres !== null
      ) {
        throw new BadRequestException(
          'Una tarjeta de crédito no puede tener configuración de deuda',
        );
      }

      await this.validarCuentaPago(
        datos.cuentaPagoId,
        usuarioId,
        cuentaActualId,
      );

      return;
    }

    if (comportamiento === ComportamientoCuenta.DEUDA) {
      if (
        datos.montoOriginal === null ||
        datos.tieneInteres === null
      ) {
        throw new BadRequestException(
          'Una deuda requiere montoOriginal y tieneInteres',
        );
      }

      if (datos.tieneInteres && datos.tasaInteres === null) {
        throw new BadRequestException(
          'Una deuda con intereses requiere tasaInteres',
        );
      }

      if (datos.cuentaPagoId !== null) {
        throw new BadRequestException(
          'Una deuda no puede tener cuentaPagoId',
        );
      }

      if (
        datos.limiteCredito !== null ||
        datos.diaCorte !== null ||
        datos.diaPago !== null
      ) {
        throw new BadRequestException(
          'Una deuda no puede tener configuración de tarjeta de crédito',
        );
      }
    }
  }

  private prepararDatosParaGuardar(
    comportamiento: ComportamientoCuenta,
    datos: DatosCuentaNormalizados,
  ) {
    if (comportamiento === ComportamientoCuenta.NORMAL) {
      return {
        nombre: datos.nombre,
        tipoCuentaId: datos.tipoCuentaId,
        limiteCredito: null,
        diaCorte: null,
        diaPago: null,
        tasaInteres: null,
        tieneInteres: null,
        montoOriginal: null,
        cuentaPagoId: null,
      };
    }

    if (comportamiento === ComportamientoCuenta.TARJETA_CREDITO) {
      return {
        nombre: datos.nombre,
        tipoCuentaId: datos.tipoCuentaId,
        limiteCredito: datos.limiteCredito,
        diaCorte: datos.diaCorte,
        diaPago: datos.diaPago,
        tasaInteres: datos.tasaInteres,
        tieneInteres: null,
        montoOriginal: null,
        cuentaPagoId: datos.cuentaPagoId,
      };
    }

    return {
      nombre: datos.nombre,
      tipoCuentaId: datos.tipoCuentaId,
      limiteCredito: null,
      diaCorte: null,
      diaPago: null,
      tasaInteres: datos.tasaInteres,
      tieneInteres: datos.tieneInteres,
      montoOriginal: datos.montoOriginal,
      cuentaPagoId: null,
    };
  }

  async crear(usuarioId: number, datos: CrearCuentaDto) {
    const tipoCuenta = await this.obtenerTipoCuenta(
      datos.tipoCuentaId,
      usuarioId,
    );

    const datosNormalizados: DatosCuentaNormalizados = {
      nombre: datos.nombre,
      tipoCuentaId: datos.tipoCuentaId,
      limiteCredito: datos.limiteCredito ?? null,
      diaCorte: datos.diaCorte ?? null,
      diaPago: datos.diaPago ?? null,
      tasaInteres: datos.tasaInteres ?? null,
      tieneInteres: datos.tieneInteres ?? null,
      montoOriginal: datos.montoOriginal ?? null,
      cuentaPagoId: datos.cuentaPagoId ?? null,
    };

    await this.validarDatosPorComportamiento(
      tipoCuenta.comportamiento,
      datosNormalizados,
      usuarioId,
    );

    const datosParaGuardar = this.prepararDatosParaGuardar(
      tipoCuenta.comportamiento,
      datosNormalizados,
    );

    return this.prisma.cuenta.create({
      data: {
        ...datosParaGuardar,
        usuarioId,
      },
      include: {
        tipoCuenta: true,
      },
    });
  }

  async listar(usuarioId: number, incluirArchivadas = false) {
    return this.prisma.cuenta.findMany({
      where: {
        usuarioId,
        ...(incluirArchivadas ? {} : { archivada: false }),
      },
      include: {
        tipoCuenta: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async actualizar(
    id: number,
    usuarioId: number,
    datos: ActualizarCuentaDto,
  ) {
    const cuentaActual = await this.obtenerCuentaPorIdYUsuario(
      id,
      usuarioId,
    );

    const tipoCuentaId =
      datos.tipoCuentaId ?? cuentaActual.tipoCuentaId;

    const tipoCuenta = await this.obtenerTipoCuenta(
      tipoCuentaId,
      usuarioId,
    );

    const datosNormalizados: DatosCuentaNormalizados = {
      nombre: datos.nombre ?? cuentaActual.nombre,
      tipoCuentaId,
      limiteCredito:
        datos.limiteCredito ??
        cuentaActual.limiteCredito?.toNumber() ??
        null,
      diaCorte:
        datos.diaCorte ??
        cuentaActual.diaCorte ??
        null,
      diaPago:
        datos.diaPago ??
        cuentaActual.diaPago ??
        null,
      tasaInteres:
        datos.tasaInteres ??
        cuentaActual.tasaInteres?.toNumber() ??
        null,
      tieneInteres:
        datos.tieneInteres ??
        cuentaActual.tieneInteres ??
        null,
      montoOriginal:
        datos.montoOriginal ??
        cuentaActual.montoOriginal?.toNumber() ??
        null,
      cuentaPagoId:
        datos.cuentaPagoId ??
        cuentaActual.cuentaPagoId ??
        null,
    };

    await this.validarDatosPorComportamiento(
      tipoCuenta.comportamiento,
      datosNormalizados,
      usuarioId,
      id,
    );

    const datosParaGuardar = this.prepararDatosParaGuardar(
      tipoCuenta.comportamiento,
      datosNormalizados,
    );

    return this.prisma.cuenta.update({
      where: {
        id,
      },
      data: datosParaGuardar,
      include: {
        tipoCuenta: true,
      },
    });
  }

  async archivar(id: number, usuarioId: number) {
    await this.obtenerCuentaPorIdYUsuario(id, usuarioId);

    return this.prisma.cuenta.update({
      where: {
        id,
      },
      data: {
        archivada: true,
      },
    });
  }

  async desarchivar(id: number, usuarioId: number) {
    await this.obtenerCuentaPorIdYUsuario(id, usuarioId);

    return this.prisma.cuenta.update({
      where: {
        id,
      },
      data: {
        archivada: false,
      },
    });
  }

  async obtenerSaldo(id: number, usuarioId: number) {
    const cuenta = await this.obtenerCuentaPorIdYUsuario(
      id,
      usuarioId,
    );

    const transacciones = await this.prisma.transaccion.findMany({
      where: {
        usuarioId,
        OR: [
          {
            cuentaId: id,
          },
          {
            cuentaDestinoId: id,
          },
        ],
      },
      select: {
        tipo: true,
        monto: true,
        cuentaId: true,
        cuentaDestinoId: true,
        componenteDeuda: true,
      },
    });

    let saldo = 0;

    if (
      cuenta.tipoCuenta.comportamiento ===
      ComportamientoCuenta.NORMAL
    ) {
      for (const transaccion of transacciones) {
        if (transaccion.tipo === TipoMovimiento.INGRESO) {
          saldo += transaccion.monto.toNumber();
        }

        if (transaccion.tipo === TipoMovimiento.GASTO) {
          saldo -= transaccion.monto.toNumber();
        }

        if (transaccion.tipo === TipoMovimiento.TRANSFERENCIA) {
          if (transaccion.cuentaId === id) {
            saldo -= transaccion.monto.toNumber();
          }

          if (transaccion.cuentaDestinoId === id) {
            saldo += transaccion.monto.toNumber();
          }
        }
      }
    }

    if (
      cuenta.tipoCuenta.comportamiento ===
      ComportamientoCuenta.TARJETA_CREDITO
    ) {
      for (const transaccion of transacciones) {
        if (transaccion.tipo === TipoMovimiento.GASTO) {
          saldo += transaccion.monto.toNumber();
        }

        if (
          transaccion.tipo === TipoMovimiento.TRANSFERENCIA &&
          transaccion.cuentaDestinoId === id
        ) {
          saldo -= transaccion.monto.toNumber();
        }
      }
    }

    if (
      cuenta.tipoCuenta.comportamiento ===
      ComportamientoCuenta.DEUDA
    ) {
      for (const transaccion of transacciones) {
        if (
          transaccion.tipo === TipoMovimiento.TRANSFERENCIA &&
          transaccion.cuentaDestinoId === id
        ) {
          if (transaccion.componenteDeuda !== 'INTERES') {
            saldo -= transaccion.monto.toNumber();
          }
        }
      }

      saldo =
        (cuenta.montoOriginal?.toNumber() ?? 0) + saldo;
    }

    return {
      cuentaId: cuenta.id,
      saldo,
      comportamiento: cuenta.tipoCuenta.comportamiento,
    };
  }
}
