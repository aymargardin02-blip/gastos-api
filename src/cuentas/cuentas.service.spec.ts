import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CuentasService } from './cuentas.service.js';
import { ComportamientoCuenta } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';

describe('CuentasService', () => {
  let service: CuentasService;
  let prismaMock: any;

  const tipoNormal = {
    id: 1,
    usuarioId: 1,
    comportamiento: ComportamientoCuenta.NORMAL,
    archivado: false,
  };

  const tipoTarjeta = {
    id: 2,
    usuarioId: 1,
    comportamiento: ComportamientoCuenta.TARJETA_CREDITO,
    archivado: false,
  };

  const tipoDeuda = {
    id: 3,
    usuarioId: 1,
    comportamiento: ComportamientoCuenta.DEUDA,
    archivado: false,
  };

  const cuentaPago = {
    id: 10,
    usuarioId: 1,
    archivada: false,
    tipoCuenta: tipoNormal,
  };

  beforeEach(() => {
    prismaMock = {
      cuenta: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      tipoCuenta: {
        findFirst: vi.fn(),
      },
    };
    service = new CuentasService(prismaMock);
  });

  describe('crear', () => {
    it('crea una cuenta NORMAL sin campos especiales', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoNormal);
      const cuentaCreada = {
        id: 100,
        nombre: 'Efectivo',
        tipoCuentaId: 1,
        usuarioId: 1,
      };
      prismaMock.cuenta.create.mockResolvedValue(cuentaCreada);

      const resultado = await service.crear(1, {
        nombre: 'Efectivo',
        tipoCuentaId: 1,
      });

      expect(resultado).toEqual(cuentaCreada);
      expect(prismaMock.cuenta.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Efectivo',
          tipoCuentaId: 1,
          limiteCredito: null,
          diaCorte: null,
          diaPago: null,
          tasaInteres: null,
          tieneInteres: null,
          montoOriginal: null,
          cuentaPagoId: null,
          usuarioId: 1,
        },
        include: { tipoCuenta: true },
      });
    });

    it('lanza BadRequestException si una NORMAL trae limiteCredito', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoNormal);

      await expect(
        service.crear(1, {
          nombre: 'Efectivo',
          tipoCuentaId: 1,
          limiteCredito: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crea una TARJETA_CREDITO con todos sus campos', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoTarjeta);
      prismaMock.cuenta.findFirst.mockResolvedValue(cuentaPago);
      const cuentaCreada = {
        id: 101,
        nombre: 'Visa',
        tipoCuentaId: 2,
        usuarioId: 1,
      };
      prismaMock.cuenta.create.mockResolvedValue(cuentaCreada);

      const resultado = await service.crear(1, {
        nombre: 'Visa',
        tipoCuentaId: 2,
        limiteCredito: 1000,
        diaCorte: 15,
        diaPago: 5,
        tasaInteres: 2.5,
        cuentaPagoId: 10,
      });

      expect(resultado).toEqual(cuentaCreada);
      expect(prismaMock.cuenta.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Visa',
          tipoCuentaId: 2,
          limiteCredito: 1000,
          diaCorte: 15,
          diaPago: 5,
          tasaInteres: 2.5,
          tieneInteres: null,
          montoOriginal: null,
          cuentaPagoId: 10,
          usuarioId: 1,
        },
        include: { tipoCuenta: true },
      });
    });

    it('lanza BadRequestException si una TARJETA_CREDITO no trae cuentaPagoId', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoTarjeta);

      await expect(
        service.crear(1, {
          nombre: 'Visa',
          tipoCuentaId: 2,
          limiteCredito: 1000,
          diaCorte: 15,
          diaPago: 5,
          tasaInteres: 2.5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si una TARJETA_CREDITO trae montoOriginal', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoTarjeta);

      await expect(
        service.crear(1, {
          nombre: 'Visa',
          tipoCuentaId: 2,
          limiteCredito: 1000,
          diaCorte: 15,
          diaPago: 5,
          tasaInteres: 2.5,
          cuentaPagoId: 10,
          montoOriginal: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si la cuenta de pago no existe', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoTarjeta);
      prismaMock.cuenta.findFirst.mockResolvedValue(null);

      await expect(
        service.crear(1, {
          nombre: 'Visa',
          tipoCuentaId: 2,
          limiteCredito: 1000,
          diaCorte: 15,
          diaPago: 5,
          tasaInteres: 2.5,
          cuentaPagoId: 999,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('crea una DEUDA sin interes', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoDeuda);
      const cuentaCreada = {
        id: 102,
        nombre: 'Préstamo mamá',
        tipoCuentaId: 3,
        usuarioId: 1,
      };
      prismaMock.cuenta.create.mockResolvedValue(cuentaCreada);

      const resultado = await service.crear(1, {
        nombre: 'Préstamo mamá',
        tipoCuentaId: 3,
        montoOriginal: 1000,
        tieneInteres: false,
      });

      expect(resultado).toEqual(cuentaCreada);
      expect(prismaMock.cuenta.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Préstamo mamá',
          tipoCuentaId: 3,
          limiteCredito: null,
          diaCorte: null,
          diaPago: null,
          tasaInteres: null,
          tieneInteres: false,
          montoOriginal: 1000,
          cuentaPagoId: null,
          usuarioId: 1,
        },
        include: { tipoCuenta: true },
      });
    });

    it('crea una DEUDA con interes y tasaInteres', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoDeuda);
      prismaMock.cuenta.create.mockResolvedValue({ id: 103 });

      await service.crear(1, {
        nombre: 'Préstamo banco',
        tipoCuentaId: 3,
        montoOriginal: 5000,
        tieneInteres: true,
        tasaInteres: 8,
      });

      expect(prismaMock.cuenta.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Préstamo banco',
          tipoCuentaId: 3,
          limiteCredito: null,
          diaCorte: null,
          diaPago: null,
          tasaInteres: 8,
          tieneInteres: true,
          montoOriginal: 5000,
          cuentaPagoId: null,
          usuarioId: 1,
        },
        include: { tipoCuenta: true },
      });
    });

    it('lanza BadRequestException si una DEUDA con interes no trae tasaInteres', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoDeuda);

      await expect(
        service.crear(1, {
          nombre: 'Préstamo',
          tipoCuentaId: 3,
          montoOriginal: 5000,
          tieneInteres: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si una DEUDA no trae montoOriginal', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoDeuda);

      await expect(
        service.crear(1, {
          nombre: 'Préstamo',
          tipoCuentaId: 3,
          tieneInteres: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si una DEUDA trae cuentaPagoId', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoDeuda);

      await expect(
        service.crear(1, {
          nombre: 'Préstamo',
          tipoCuentaId: 3,
          montoOriginal: 1000,
          tieneInteres: false,
          cuentaPagoId: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si el tipo de cuenta no existe', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(null);

      await expect(
        service.crear(1, {
          nombre: 'Efectivo',
          tipoCuentaId: 999,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ConflictException si el tipo de cuenta esta archivado', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue({
        ...tipoNormal,
        archivado: true,
      });

      await expect(
        service.crear(1, {
          nombre: 'Efectivo',
          tipoCuentaId: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listar', () => {
    it('por defecto solo trae las cuentas activas', async () => {
      prismaMock.cuenta.findMany.mockResolvedValue([]);

      await service.listar(1);

      expect(prismaMock.cuenta.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1, archivada: false },
        include: { tipoCuenta: true },
        orderBy: { id: 'asc' },
      });
    });

    it('con incluirArchivadas=true no filtra por archivada', async () => {
      prismaMock.cuenta.findMany.mockResolvedValue([]);

      await service.listar(1, true);

      expect(prismaMock.cuenta.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        include: { tipoCuenta: true },
        orderBy: { id: 'asc' },
      });
    });
  });

  describe('actualizar', () => {
    it('actualiza el nombre de una cuenta NORMAL', async () => {
      prismaMock.cuenta.findFirst.mockResolvedValue({
        id: 100,
        nombre: 'Viejo',
        tipoCuentaId: 1,
        tipoCuenta: tipoNormal,
        limiteCredito: null,
        diaCorte: null,
        diaPago: null,
        tasaInteres: null,
        tieneInteres: null,
        montoOriginal: null,
        cuentaPagoId: null,
        usuarioId: 1,
      });
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(tipoNormal);
      const cuentaActualizada = {
        id: 100,
        nombre: 'Nuevo',
        tipoCuentaId: 1,
        usuarioId: 1,
      };
      prismaMock.cuenta.update.mockResolvedValue(cuentaActualizada);

      const resultado = await service.actualizar(100, 1, {
        nombre: 'Nuevo',
      });

      expect(resultado).toEqual(cuentaActualizada);
      expect(prismaMock.cuenta.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          nombre: 'Nuevo',
          tipoCuentaId: 1,
          limiteCredito: null,
          diaCorte: null,
          diaPago: null,
          tasaInteres: null,
          tieneInteres: null,
          montoOriginal: null,
          cuentaPagoId: null,
        },
        include: { tipoCuenta: true },
      });
    });

    it('lanza NotFoundException si la cuenta no existe o no es del usuario', async () => {
      prismaMock.cuenta.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(999, 1, { nombre: 'X' }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.cuenta.update).not.toHaveBeenCalled();
    });
  });

  describe('archivar y desarchivar', () => {
    it('archiva la cuenta cuando existe y es del usuario', async () => {
      prismaMock.cuenta.findFirst.mockResolvedValue({
        id: 100,
        usuarioId: 1,
      });
      const cuentaArchivada = { id: 100, archivada: true };
      prismaMock.cuenta.update.mockResolvedValue(cuentaArchivada);

      const resultado = await service.archivar(100, 1);

      expect(resultado).toEqual(cuentaArchivada);
      expect(prismaMock.cuenta.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { archivada: true },
      });
    });

    it('lanza NotFoundException al archivar una cuenta inexistente', async () => {
      prismaMock.cuenta.findFirst.mockResolvedValue(null);

      await expect(service.archivar(999, 1)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.cuenta.update).not.toHaveBeenCalled();
    });

    it('desarchiva la cuenta cuando existe y es del usuario', async () => {
      prismaMock.cuenta.findFirst.mockResolvedValue({
        id: 100,
        usuarioId: 1,
      });
      const cuentaDesarchivada = { id: 100, archivada: false };
      prismaMock.cuenta.update.mockResolvedValue(cuentaDesarchivada);

      const resultado = await service.desarchivar(100, 1);

      expect(resultado).toEqual(cuentaDesarchivada);
      expect(prismaMock.cuenta.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { archivada: false },
      });
    });
  });
});
