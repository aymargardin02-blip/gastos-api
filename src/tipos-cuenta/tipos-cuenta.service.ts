import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CrearTipoCuentaDto } from './dto/crear-tipo-cuenta.dto.js';
import { ActualizarTipoCuentaDto } from './dto/actualizar-tipo-cuenta.dto.js';

@Injectable()
export class TiposCuentaService {
  constructor(private readonly prisma: PrismaService) {}

  // MÉTODO PRIVADO (HELPER): Lo usamos internamente para no duplicar código.
  // Busca el tipo de cuenta y verifica que pertenezca al usuario del token.
  // Si no existe o es de otro usuario, lanza el error 404 (NotFoundException).
  private async obtenerPorIdYUsuario(id: number, usuarioId: number) {
    const tipoCuenta = await this.prisma.tipoCuenta.findFirst({
      where: { id, usuarioId },
    });

    if (!tipoCuenta) {
      throw new NotFoundException('Tipo de cuenta no encontrado');
    }

    return tipoCuenta;
  }

  // CREAR: Inserta el nuevo tipo de cuenta en la base de datos vinculado al usuario.
  async crear(usuarioId: number, datos: CrearTipoCuentaDto) {
    return this.prisma.tipoCuenta.create({
      data: {
        ...datos,
        usuarioId,
      },
    });
  }

  // LISTAR: Devuelve los tipos de cuenta del usuario.
  // Si 'incluirArchivados' es false (por defecto), solo trae los activos (archivado: false).
  async listar(usuarioId: number, incluirArchivados: boolean = false) {
    return this.prisma.tipoCuenta.findMany({
      where: {
        usuarioId,
        ...(incluirArchivados ? {} : { archivado: false }),
      },
      orderBy: { id: 'asc' },
    });
  }

  // ACTUALIZAR: Modifica solo los campos permitidos (el nombre) usando nuestro DTO.
  async actualizar(id: number, usuarioId: number, datos: ActualizarTipoCuentaDto) {
    await this.obtenerPorIdYUsuario(id, usuarioId); // Valida propiedad antes de actuar

    return this.prisma.tipoCuenta.update({
      where: { id },
      data: datos,
    });
  }

  // ARCHIVAR: Aplica nuestra regla de negocio para evitar corromper datos.
  async archivar(id: number, usuarioId: number) {
    await this.obtenerPorIdYUsuario(id, usuarioId);

    // 1. Contamos cuántas cuentas NO archivadas usan este tipo
    const cuentasActivas = await this.prisma.cuenta.count({
      where: {
        tipoCuentaId: id,
        archivada: false,
      },
    });

    // 2. Si hay al menos 1, lanzamos el error de conflicto (409)
    if (cuentasActivas > 0) {
      throw new ConflictException(
        `No se puede archivar este tipo de cuenta porque hay ${cuentasActivas} cuenta(s) activa(s) usándolo.`
      );
    }

    // 3. Si no hay cuentas activas, lo archivamos
    return this.prisma.tipoCuenta.update({
      where: { id },
      data: { archivado: true },
    });
  }

  // DESARCHIVAR: Simplemente devuelve el estado archivado a false.
  async desarchivar(id: number, usuarioId: number) {
    await this.obtenerPorIdYUsuario(id, usuarioId);

    return this.prisma.tipoCuenta.update({
      where: { id },
      data: { archivado: false },
    });
  }
}