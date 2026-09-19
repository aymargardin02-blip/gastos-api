import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransaccionesService } from './transacciones.service.js';
import { TipoMovimiento } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';

describe('TransaccionesService', () => {
  let service: TransaccionesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      categoria: {
        findFirst: vi.fn(),
      },
      transaccion: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new TransaccionesService(prismaMock);
  });

  describe('crear', () => {
    it('lanza NotFoundException si la categoria no existe o no es del usuario', async () => {
      prismaMock.categoria.findFirst.mockResolvedValue(null);

      await expect(
        service.crear(1, {
          tipo: TipoMovimiento.GASTO,
          monto: 20,
          fecha: '2026-09-19',
          categoriaId: 99,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si el tipo no coincide con el de la categoria', async () => {
      prismaMock.categoria.findFirst.mockResolvedValue({
        id: 2,
        tipo: TipoMovimiento.INGRESO,
        usuarioId: 1,
      });

      await expect(
        service.crear(1, {
          tipo: TipoMovimiento.GASTO,
          monto: 20,
          fecha: '2026-09-19',
          categoriaId: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crea la transaccion cuando la categoria existe y el tipo coincide', async () => {
      prismaMock.categoria.findFirst.mockResolvedValue({
        id: 2,
        tipo: TipoMovimiento.GASTO,
        usuarioId: 1,
      });
      const transaccionCreada = {
        id: 10,
        tipo: TipoMovimiento.GASTO,
        monto: 20,
        descripcion: 'Almuerzo',
        fecha: new Date('2026-09-19'),
        categoriaId: 2,
        usuarioId: 1,
      };
      prismaMock.transaccion.create.mockResolvedValue(transaccionCreada);

      const resultado = await service.crear(1, {
        tipo: TipoMovimiento.GASTO,
        monto: 20,
        descripcion: 'Almuerzo',
        fecha: '2026-09-19',
        categoriaId: 2,
      });

      expect(resultado).toEqual(transaccionCreada);
      expect(prismaMock.transaccion.create).toHaveBeenCalledWith({
        data: {
          tipo: TipoMovimiento.GASTO,
          monto: 20,
          descripcion: 'Almuerzo',
          fecha: new Date('2026-09-19'),
          categoriaId: 2,
          usuarioId: 1,
        },
      });
    });
  });

  describe('actualizar', () => {
    it('lanza NotFoundException si la transaccion no existe o no es del usuario', async () => {
      prismaMock.transaccion.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(1, 5, { monto: 15 }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.transaccion.update).not.toHaveBeenCalled();
    });

    it('actualiza solo el monto sin revalidar la categoria', async () => {
      prismaMock.transaccion.findFirst.mockResolvedValue({
        id: 5,
        tipo: TipoMovimiento.GASTO,
        monto: 20,
        categoriaId: 2,
        usuarioId: 1,
      });
      const transaccionActualizada = {
        id: 5,
        tipo: TipoMovimiento.GASTO,
        monto: 15,
        categoriaId: 2,
        usuarioId: 1,
      };
      prismaMock.transaccion.update.mockResolvedValue(transaccionActualizada);

      const resultado = await service.actualizar(1, 5, { monto: 15 });

      expect(resultado).toEqual(transaccionActualizada);
      expect(prismaMock.categoria.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.transaccion.update).toHaveBeenCalledWith({
        where: { id: 5, usuarioId: 1 },
        data: { monto: 15, fecha: undefined },
      });
    });

    it('revalida la categoria cuando el PATCH cambia el tipo', async () => {
      prismaMock.transaccion.findFirst.mockResolvedValue({
        id: 5,
        tipo: TipoMovimiento.GASTO,
        monto: 20,
        categoriaId: 2,
        usuarioId: 1,
      });
      prismaMock.categoria.findFirst.mockResolvedValue({
        id: 3,
        tipo: TipoMovimiento.INGRESO,
        usuarioId: 1,
      });
      prismaMock.transaccion.update.mockResolvedValue({});

      await service.actualizar(1, 5, {
        tipo: TipoMovimiento.INGRESO,
        categoriaId: 3,
      });

      expect(prismaMock.categoria.findFirst).toHaveBeenCalledWith({
        where: { id: 3, usuarioId: 1 },
      });
    });
  });

  describe('eliminar', () => {
    it('elimina y devuelve la transaccion cuando existe', async () => {
      const transaccionBorrada = {
        id: 5,
        tipo: TipoMovimiento.GASTO,
        monto: 20,
        categoriaId: 2,
        usuarioId: 1,
      };
      prismaMock.transaccion.delete.mockResolvedValue(transaccionBorrada);

      const resultado = await service.eliminar(1, 5);

      expect(resultado).toEqual(transaccionBorrada);
      expect(prismaMock.transaccion.delete).toHaveBeenCalledWith({
        where: { id: 5, usuarioId: 1 },
      });
    });

    it('lanza NotFoundException si Prisma no encuentra el registro (P2025)', async () => {
      const errorPrisma = new Prisma.PrismaClientKnownRequestError(
        'Registro no encontrado',
        { code: 'P2025', clientVersion: '7.10.0' },
      );
      prismaMock.transaccion.delete.mockRejectedValue(errorPrisma);

      await expect(service.eliminar(1, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
