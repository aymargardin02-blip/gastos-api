import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { PresupuestosService } from './presupuestos.service.js';

describe('PresupuestosService', () => {
  let service: PresupuestosService;

  const prisma = {
  presupuesto: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  categoria: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  transaccion: {
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
  limitePresupuesto: {
    update: vi.fn(),
  },
};

  beforeEach(() => {
    vi.clearAllMocks();

    service = new PresupuestosService(
      prisma as unknown as PrismaService,
    );
  });

  describe('crear', () => {
    it('crea un presupuesto cuando los datos son válidos', async () => {
      prisma.presupuesto.findMany.mockResolvedValue([]);

      prisma.categoria.findMany.mockResolvedValue([
        {
          id: 1,
          tipo: 'GASTO',
        },
      ]);

      prisma.presupuesto.create.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'MENSUAL',
        activo: true,
        limites: [],
      });

      const resultado = await service.crear(1, {
        tipo: 'MENSUAL',
        limites: [
          {
            categoriaId: 1,
            limite: 100,
          },
        ],
      });

      expect(resultado.id).toBe(1);
      expect(prisma.presupuesto.create).toHaveBeenCalled();
    });

    it('permite crear un presupuesto mensual y uno quincenal', async () => {
      prisma.presupuesto.findMany.mockResolvedValue([
        {
          tipo: 'MENSUAL',
        },
      ]);

      prisma.categoria.findMany.mockResolvedValue([
        {
          id: 1,
          tipo: 'GASTO',
        },
      ]);

      prisma.presupuesto.create.mockResolvedValue({
        id: 2,
        usuarioId: 1,
        tipo: 'QUINCENAL',
        activo: true,
        limites: [],
      });

      const resultado = await service.crear(1, {
        tipo: 'QUINCENAL',
        limites: [
          {
            categoriaId: 1,
            limite: 50,
          },
        ],
      });

      expect(resultado.id).toBe(2);
      expect(prisma.presupuesto.create).toHaveBeenCalled();
    });

    it('rechaza otro presupuesto activo del mismo tipo', async () => {
      prisma.presupuesto.findMany.mockResolvedValue([
        {
          tipo: 'MENSUAL',
        },
      ]);

      await expect(
        service.crear(1, {
          tipo: 'MENSUAL',
          limites: [
            {
              categoriaId: 1,
              limite: 100,
            },
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza más de dos presupuestos activos', async () => {
      prisma.presupuesto.findMany.mockResolvedValue([
        {
          tipo: 'MENSUAL',
        },
        {
          tipo: 'QUINCENAL',
        },
      ]);

      await expect(
        service.crear(1, {
          tipo: 'MENSUAL',
          limites: [
            {
              categoriaId: 1,
              limite: 100,
            },
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza categorías repetidas', async () => {
      prisma.presupuesto.findMany.mockResolvedValue([]);

      await expect(
        service.crear(1, {
          tipo: 'MENSUAL',
          limites: [
            {
              categoriaId: 1,
              limite: 100,
            },
            {
              categoriaId: 1,
              limite: 50,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza categorías que no pertenecen al usuario', async () => {
      prisma.presupuesto.findMany.mockResolvedValue([]);
      prisma.categoria.findMany.mockResolvedValue([]);

      await expect(
        service.crear(1, {
          tipo: 'MENSUAL',
          limites: [
            {
              categoriaId: 999,
              limite: 100,
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza categorías que no son de gasto', async () => {
      prisma.presupuesto.findMany.mockResolvedValue([]);

      prisma.categoria.findMany.mockResolvedValue([
        {
          id: 1,
          tipo: 'INGRESO',
        },
      ]);

      await expect(
        service.crear(1, {
          tipo: 'MENSUAL',
          limites: [
            {
              categoriaId: 1,
              limite: 100,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('obtener', () => {
    it('calcula gastado, disponible, porcentaje y estado NORMAL', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'MENSUAL',
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        limites: [
          {
            id: 1,
            presupuestoId: 1,
            categoriaId: 1,
            limite: new Prisma.Decimal(100),
            categoria: {
              id: 1,
              nombre: 'Alimentos',
            },
          },
        ],
      });

      prisma.transaccion.groupBy.mockResolvedValue([
        {
          categoriaId: 1,
          _sum: {
            monto: new Prisma.Decimal(50),
          },
        },
      ]);

      const resultado = await service.obtener(1, 1);

      expect(resultado.limites[0].gastado).toBe('50.00');
      expect(resultado.limites[0].disponible).toBe('50.00');
      expect(resultado.limites[0].porcentaje).toBe(50);
      expect(resultado.limites[0].estado).toBe('NORMAL');
    });

    it('marca CERCA cuando el gasto alcanza el 80%', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'MENSUAL',
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        limites: [
          {
            id: 1,
            presupuestoId: 1,
            categoriaId: 1,
            limite: new Prisma.Decimal(100),
            categoria: {
              id: 1,
              nombre: 'Alimentos',
            },
          },
        ],
      });

      prisma.transaccion.groupBy.mockResolvedValue([
        {
          categoriaId: 1,
          _sum: {
            monto: new Prisma.Decimal(85),
          },
        },
      ]);

      const resultado = await service.obtener(1, 1);

      expect(resultado.limites[0].gastado).toBe('85.00');
      expect(resultado.limites[0].porcentaje).toBe(85);
      expect(resultado.limites[0].estado).toBe('CERCA');
    });

    it('marca EXCEDIDO cuando supera el límite', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'MENSUAL',
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        limites: [
          {
            id: 1,
            presupuestoId: 1,
            categoriaId: 1,
            limite: new Prisma.Decimal(100),
            categoria: {
              id: 1,
              nombre: 'Alimentos',
            },
          },
        ],
      });

      prisma.transaccion.groupBy.mockResolvedValue([
        {
          categoriaId: 1,
          _sum: {
            monto: new Prisma.Decimal(120),
          },
        },
      ]);

      const resultado = await service.obtener(1, 1);

      expect(resultado.limites[0].gastado).toBe('120.00');
      expect(resultado.limites[0].disponible).toBe('-20.00');
      expect(resultado.limites[0].porcentaje).toBe(120);
      expect(resultado.limites[0].estado).toBe('EXCEDIDO');
    });

    it('no cuenta movimientos que no sean gastos', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'MENSUAL',
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        limites: [
          {
            id: 1,
            presupuestoId: 1,
            categoriaId: 1,
            limite: new Prisma.Decimal(100),
            categoria: {
              id: 1,
              nombre: 'Alimentos',
            },
          },
        ],
      });

      prisma.transaccion.groupBy.mockResolvedValue([]);

      await service.obtener(1, 1);

      expect(prisma.transaccion.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo: 'GASTO',
          }),
        }),
      );
    });

    it('usa el periodo quincenal correcto durante la primera quincena', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-10T12:00:00.000Z'));

      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'QUINCENAL',
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        limites: [
          {
            id: 1,
            presupuestoId: 1,
            categoriaId: 1,
            limite: new Prisma.Decimal(100),
            categoria: {
              id: 1,
              nombre: 'Alimentos',
            },
          },
        ],
      });

      prisma.transaccion.groupBy.mockResolvedValue([]);

      const resultado = await service.obtener(1, 1);

      expect(resultado.periodo.desde).toEqual(
        new Date('2026-10-01T00:00:00.000Z'),
      );

      expect(resultado.periodo.hasta).toEqual(
        new Date('2026-10-16T00:00:00.000Z'),
      );

      vi.useRealTimers();
    });

    it('usa el periodo quincenal correcto durante la segunda quincena', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-20T12:00:00.000Z'));

      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'QUINCENAL',
        activo: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        limites: [
          {
            id: 1,
            presupuestoId: 1,
            categoriaId: 1,
            limite: new Prisma.Decimal(100),
            categoria: {
              id: 1,
              nombre: 'Alimentos',
            },
          },
        ],
      });

      prisma.transaccion.groupBy.mockResolvedValue([]);

      const resultado = await service.obtener(1, 1);

      expect(resultado.periodo.desde).toEqual(
        new Date('2026-10-16T00:00:00.000Z'),
      );

      expect(resultado.periodo.hasta).toEqual(
        new Date('2026-11-01T00:00:00.000Z'),
      );

      vi.useRealTimers();
    });

    it('rechaza un presupuesto inexistente', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue(null);

      await expect(
        service.obtener(1, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizarLimite', () => {
    it('actualiza un límite cuando todavía no se ha alcanzado', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        tipo: 'MENSUAL',
        activo: true,
        limites: [
          {
            id: 10,
            limite: new Prisma.Decimal(100),
          },
        ],
      });

      prisma.categoria.findFirst.mockResolvedValue({
        id: 1,
      });

      prisma.transaccion.aggregate.mockResolvedValue({
        _sum: {
          monto: new Prisma.Decimal(50),
        },
      });

      prisma.limitePresupuesto = {
        update: vi.fn().mockResolvedValue({
          id: 10,
          limite: new Prisma.Decimal(120),
          categoria: {
            id: 1,
            nombre: 'Alimentos',
          },
        }),
      };

      const resultado = await service.actualizarLimite(
        1,
        1,
        1,
        {
          limite: 120,
        },
      );

      expect(resultado.id).toBe(10);
      expect(prisma.limitePresupuesto.update).toHaveBeenCalledWith({
        where: {
          id: 10,
        },
        data: {
          limite: 120,
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
    });

    it('rechaza reducir el límite por debajo de lo gastado', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        tipo: 'MENSUAL',
        activo: true,
        limites: [
          {
            id: 10,
            limite: new Prisma.Decimal(100),
          },
        ],
      });

      prisma.categoria.findFirst.mockResolvedValue({
        id: 1,
      });

      prisma.transaccion.aggregate.mockResolvedValue({
        _sum: {
          monto: new Prisma.Decimal(70),
        },
      });

      await expect(
        service.actualizarLimite(1, 1, 1, {
          limite: 60,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza modificar el límite cuando ya fue alcanzado', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        tipo: 'MENSUAL',
        activo: true,
        limites: [
          {
            id: 10,
            limite: new Prisma.Decimal(100),
          },
        ],
      });

      prisma.categoria.findFirst.mockResolvedValue({
        id: 1,
      });

      prisma.transaccion.aggregate.mockResolvedValue({
        _sum: {
          monto: new Prisma.Decimal(100),
        },
      });

      await expect(
        service.actualizarLimite(1, 1, 1, {
          limite: 150,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza modificar un presupuesto inactivo', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        tipo: 'MENSUAL',
        activo: false,
        limites: [
          {
            id: 10,
            limite: new Prisma.Decimal(100),
          },
        ],
      });

      await expect(
        service.actualizarLimite(1, 1, 1, {
          limite: 120,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cambiarEstado', () => {
    it('desactiva un presupuesto activo', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'MENSUAL',
        activo: true,
      });

      prisma.presupuesto.update.mockResolvedValue({
        id: 1,
        activo: false,
      });

      const resultado = await service.cambiarEstado(
        1,
        1,
        false,
      );

      expect(resultado.activo).toBe(false);

      expect(prisma.presupuesto.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          activo: false,
        },
      });
    });

    it('reactiva un presupuesto cuando todavía hay espacio', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'MENSUAL',
        activo: false,
      });

      prisma.presupuesto.count.mockResolvedValue(0);

      prisma.presupuesto.findFirst
        .mockResolvedValueOnce({
          id: 1,
          usuarioId: 1,
          tipo: 'MENSUAL',
          activo: false,
        })
        .mockResolvedValueOnce(null);

      prisma.presupuesto.update.mockResolvedValue({
        id: 1,
        activo: true,
      });

      const resultado = await service.cambiarEstado(
        1,
        1,
        true,
      );

      expect(resultado.activo).toBe(true);
    });

    it('rechaza reactivar cuando ya existen dos presupuestos activos', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        tipo: 'MENSUAL',
        activo: false,
      });

      prisma.presupuesto.count.mockResolvedValue(2);

      await expect(
        service.cambiarEstado(1, 1, true),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza reactivar si ya existe otro presupuesto activo del mismo tipo', async () => {
      prisma.presupuesto.findFirst
        .mockResolvedValueOnce({
          id: 1,
          usuarioId: 1,
          tipo: 'MENSUAL',
          activo: false,
        })
        .mockResolvedValueOnce({
          id: 2,
          usuarioId: 1,
          tipo: 'MENSUAL',
          activo: true,
        });

      prisma.presupuesto.count.mockResolvedValue(1);

      await expect(
        service.cambiarEstado(1, 1, true),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza cambiar el estado de un presupuesto inexistente', async () => {
      prisma.presupuesto.findFirst.mockResolvedValue(null);

      await expect(
        service.cambiarEstado(1, 999, false),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
