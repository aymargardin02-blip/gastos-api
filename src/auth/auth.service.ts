import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service.js';
import { RegistrarDto } from './dto/registrar.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  async login(datos: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: datos.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const contrasenaValida = await argon2.verify(usuario.contrasenaHash, datos.contrasena);

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    const token = await this.jwtService.signAsync(payload);

    return { access_token: token };
  }
}
