import { BalanceService } from './balance.service.js';
import { TipoMovimiento } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';

describe('BalanceService', () => {
  let service: BalanceService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      transaccion: {
        groupBy: vi.fn(),
      },
    };
    service = new BalanceService(prismaMock);
  });

  it('calcula el balance cuando hay ingresos y gastos', async () => {
    prismaMock.transaccion.groupBy.mockResolvedValue([
      { tipo: TipoMovimiento.INGRESO, _sum: { monto: new Prisma.Decimal(500) } },
      { tipo: TipoMovimiento.GASTO, _sum: { monto: new Prisma.Decimal(20) } },
    ]);

    const resultado = await service.obtener(1, {});

    expect(resultado).toEqual({
      desde: null,
      hasta: null,
      ingresos: '500.00',
      gastos: '20.00',
      balance: '480.00',
    });
  });

  it('devuelve ceros cuando el usuario no tiene transacciones', async () => {
    prismaMock.transaccion.groupBy.mockResolvedValue([]);

    const resultado = await service.obtener(2, {});

    expect(resultado).toEqual({
      desde: null,
      hasta: null,
      ingresos: '0.00',
      gastos: '0.00',
      balance: '0.00',
    });
  });

  it('arma el filtro de fecha cuando se pasan desde y hasta', async () => {
    prismaMock.transaccion.groupBy.mockResolvedValue([]);

    await service.obtener(1, { desde: '2026-09-01', hasta: '2026-09-30' });

    expect(prismaMock.transaccion.groupBy).toHaveBeenCalledWith({
      by: ['tipo'],
      where: {
        usuarioId: 1,
        fecha: {
          gte: new Date('2026-09-01'),
          lte: new Date('2026-09-30'),
        },
      },
      _sum: { monto: true },
    });
  });
});
