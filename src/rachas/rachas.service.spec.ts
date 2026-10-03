import { RachasService } from './rachas.service.js';

describe('RachasService', () => {
  let service: RachasService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      usuario: {
        findUnique: vi.fn(),
      },
      transaccion: {
        findMany: vi.fn(),
      },
      racha: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    };

    service = new RachasService(prismaMock);

    prismaMock.usuario.findUnique.mockResolvedValue({
      zonaHoraria: 'America/Panama',
    });

    prismaMock.racha.findUnique.mockResolvedValue(null);

    prismaMock.racha.upsert.mockImplementation(
      async ({ create }: { create: any }) => create,
    );
  });

  describe('obtener', () => {
    it('devuelve una racha vacia cuando no existe registro', async () => {
      const resultado = await service.obtener(1);

      expect(resultado).toEqual({
        rachaActual: 0,
        mejorRacha: 0,
        ultimoDiaRegistro: null,
      });
    });

    it('devuelve la racha existente', async () => {
      const racha = {
        rachaActual: 5,
        mejorRacha: 8,
        ultimoDiaRegistro: new Date('2026-10-01T00:00:00.000Z'),
      };

      prismaMock.racha.findUnique.mockResolvedValue(racha);

      const resultado = await service.obtener(1);

      expect(resultado).toEqual(racha);
    });
  });

  describe('recalcular', () => {
    it('crea una racha en cero cuando no existen transacciones registradas', async () => {
      prismaMock.transaccion.findMany.mockResolvedValue([]);

      const resultado = await service.recalcular(1);

      expect(resultado).toEqual({
        usuarioId: 1,
        rachaActual: 0,
        mejorRacha: 0,
        ultimoDiaRegistro: null,
      });

      expect(prismaMock.racha.upsert).toHaveBeenCalled();
    });

    it('calcula una racha de un dia con un solo registro', async () => {
      prismaMock.transaccion.findMany.mockResolvedValue([
        {
          registradaEn: new Date(),
        },
      ]);

      const resultado = await service.recalcular(1);

      expect(resultado.rachaActual).toBe(1);
      expect(resultado.mejorRacha).toBe(1);
    });

    it('cuenta varias transacciones del mismo dia como un solo dia', async () => {
      const hoy = new Date();

      prismaMock.transaccion.findMany.mockResolvedValue([
        {
          registradaEn: new Date(hoy.getTime() - 60 * 60 * 1000),
        },
        {
          registradaEn: hoy,
        },
        {
          registradaEn: new Date(hoy.getTime() - 2 * 60 * 60 * 1000),
        },
      ]);

      const resultado = await service.recalcular(1);

      expect(resultado.rachaActual).toBe(1);
      expect(resultado.mejorRacha).toBe(1);
    });

    it('calcula una racha consecutiva de varios dias', async () => {
      const hoy = new Date();

      const diaAnterior = new Date(hoy);
      diaAnterior.setDate(diaAnterior.getDate() - 1);

      const haceDosDias = new Date(hoy);
      haceDosDias.setDate(haceDosDias.getDate() - 2);

      prismaMock.transaccion.findMany.mockResolvedValue([
        {
          registradaEn: haceDosDias,
        },
        {
          registradaEn: diaAnterior,
        },
        {
          registradaEn: hoy,
        },
      ]);

      const resultado = await service.recalcular(1);

      expect(resultado.rachaActual).toBe(3);
      expect(resultado.mejorRacha).toBe(3);
    });

    it('rompe la racha actual cuando falta mas de un dia', async () => {
      const hoy = new Date();

      const haceTresDias = new Date(hoy);
      haceTresDias.setDate(haceTresDias.getDate() - 3);

      prismaMock.transaccion.findMany.mockResolvedValue([
        {
          registradaEn: haceTresDias,
        },
      ]);

      const resultado = await service.recalcular(1);

      expect(resultado.rachaActual).toBe(0);
      expect(resultado.mejorRacha).toBe(1);
    });

    it('mantiene la mejor racha historica aunque la racha actual se rompa', async () => {
      const hoy = new Date();

      const haceTresDias = new Date(hoy);
      haceTresDias.setDate(haceTresDias.getDate() - 3);

      prismaMock.racha.findUnique.mockResolvedValue({
        mejorRacha: 7,
      });

      prismaMock.transaccion.findMany.mockResolvedValue([
        {
          registradaEn: haceTresDias,
        },
      ]);

      const resultado = await service.recalcular(1);

      expect(resultado.rachaActual).toBe(0);
      expect(resultado.mejorRacha).toBe(7);
    });

    it('calcula la mejor racha aunque la racha actual sea mas corta', async () => {
      const hoy = new Date();

      const haceCincoDias = new Date(hoy);
      haceCincoDias.setDate(haceCincoDias.getDate() - 5);

      const haceCuatroDias = new Date(hoy);
      haceCuatroDias.setDate(haceCuatroDias.getDate() - 4);

      const haceTresDias = new Date(hoy);
      haceTresDias.setDate(haceTresDias.getDate() - 3);

      prismaMock.transaccion.findMany.mockResolvedValue([
        {
          registradaEn: haceCincoDias,
        },
        {
          registradaEn: haceCuatroDias,
        },
        {
          registradaEn: haceTresDias,
        },
        {
          registradaEn: hoy,
        },
      ]);

      const resultado = await service.recalcular(1);

      expect(resultado.rachaActual).toBe(1);
      expect(resultado.mejorRacha).toBe(3);
    });
  });
});
