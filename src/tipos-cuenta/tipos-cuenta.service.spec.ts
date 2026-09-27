import { NotFoundException, ConflictException } from '@nestjs/common';
import { TiposCuentaService } from './tipos-cuenta.service.js';
import { ComportamientoCuenta } from '../generated/prisma/enums.js';

describe('TiposCuentaService', () => {
  let service: TiposCuentaService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      tipoCuenta: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      cuenta: {
        count: vi.fn(),
      },
    };
    service = new TiposCuentaService(prismaMock);
  });

  describe('crear', () => {
    it('crea el tipo de cuenta vinculado al usuario', async () => {
      const tipoCreado = {
        id: 1,
        nombre: 'Criptomonedas',
        comportamiento: ComportamientoCuenta.NORMAL,
        archivado: false,
        usuarioId: 1,
      };
      prismaMock.tipoCuenta.create.mockResolvedValue(tipoCreado);

      const resultado = await service.crear(1, {
        nombre: 'Criptomonedas',
        comportamiento: ComportamientoCuenta.NORMAL,
      });

      expect(resultado).toEqual(tipoCreado);
      expect(prismaMock.tipoCuenta.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Criptomonedas',
          comportamiento: ComportamientoCuenta.NORMAL,
          usuarioId: 1,
        },
      });
    });
  });

  describe('listar', () => {
    it('por defecto solo trae los tipos activos', async () => {
      prismaMock.tipoCuenta.findMany.mockResolvedValue([]);

      await service.listar(1);

      expect(prismaMock.tipoCuenta.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1, archivado: false },
        orderBy: { id: 'asc' },
      });
    });

    it('con incluirArchivados=true no filtra por archivado', async () => {
      prismaMock.tipoCuenta.findMany.mockResolvedValue([]);

      await service.listar(1, true);

      expect(prismaMock.tipoCuenta.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        orderBy: { id: 'asc' },
      });
    });
  });

  describe('actualizar', () => {
    it('actualiza el nombre cuando el tipo existe y es del usuario', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue({
        id: 3,
        nombre: 'Viejo',
        usuarioId: 1,
      });
      const tipoActualizado = {
        id: 3,
        nombre: 'Nuevo',
        usuarioId: 1,
      };
      prismaMock.tipoCuenta.update.mockResolvedValue(tipoActualizado);

      const resultado = await service.actualizar(3, 1, { nombre: 'Nuevo' });

      expect(resultado).toEqual(tipoActualizado);
      expect(prismaMock.tipoCuenta.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { nombre: 'Nuevo' },
      });
    });

    it('lanza NotFoundException si el tipo no existe o no es del usuario', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(99, 1, { nombre: 'X' }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaMock.tipoCuenta.update).not.toHaveBeenCalled();
    });
  });

  describe('archivar', () => {
    it('lanza ConflictException si hay cuentas activas usando el tipo', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue({
        id: 3,
        usuarioId: 1,
      });
      prismaMock.cuenta.count.mockResolvedValue(2);

      await expect(service.archivar(3, 1)).rejects.toThrow(
        ConflictException,
      );

      expect(prismaMock.tipoCuenta.update).not.toHaveBeenCalled();
    });

    it('archiva el tipo cuando no hay cuentas activas', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue({
        id: 3,
        usuarioId: 1,
      });
      prismaMock.cuenta.count.mockResolvedValue(0);
      const tipoArchivado = { id: 3, archivado: true, usuarioId: 1 };
      prismaMock.tipoCuenta.update.mockResolvedValue(tipoArchivado);

      const resultado = await service.archivar(3, 1);

      expect(resultado).toEqual(tipoArchivado);
      expect(prismaMock.tipoCuenta.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { archivado: true },
      });
    });
  });

  describe('desarchivar', () => {
    it('desarchiva el tipo cuando existe y es del usuario', async () => {
      prismaMock.tipoCuenta.findFirst.mockResolvedValue({
        id: 3,
        usuarioId: 1,
      });
      const tipoDesarchivado = { id: 3, archivado: false, usuarioId: 1 };
      prismaMock.tipoCuenta.update.mockResolvedValue(tipoDesarchivado);

      const resultado = await service.desarchivar(3, 1);

      expect(resultado).toEqual(tipoDesarchivado);
      expect(prismaMock.tipoCuenta.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { archivado: false },
      });
    });
  });
});
