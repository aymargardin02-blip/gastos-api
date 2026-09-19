import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransaccionesService } from './transacciones.service.js';
import { TipoMovimiento } from '../generated/prisma/enums.js';

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
      },
    };
    service = new TransaccionesService(prismaMock);
  });

  it('lanza NotFoundException si la categoría no existe o no es del usuario', async () => {
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

  it('lanza BadRequestException si el tipo no coincide con el de la categoría', async () => {
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

  it('crea la transacción cuando la categoría existe y el tipo coincide', async () => {
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
