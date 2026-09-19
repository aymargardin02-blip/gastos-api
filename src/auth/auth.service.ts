import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service.js';
import { RegistrarDto } from './dto/registrar.dto.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(datos: RegistrarDto) {
    const contrasenaHash = await argon2.hash(datos.contrasena);

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          nombre: datos.nombre,
          email: datos.email,
          contrasenaHash,
        },
      });

      const { contrasenaHash: _, ...usuarioSinContrasena } = usuario;
      return usuarioSinContrasena;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
      throw error;
    }
  }
}
