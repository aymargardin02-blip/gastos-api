import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistrarDto } from './dto/registrar.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(datos: RegistrarDto) {
    if (!datos.aceptaTerminos || !datos.aceptaPrivacidad) {
      throw new BadRequestException(
        'Debes aceptar los Términos y la Política de Privacidad para registrarte',
      );
    }

    const contrasenaHash = await argon2.hash(datos.contrasena);

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          nombre: datos.nombre,
          email: datos.email,
          contrasenaHash,

          tiposCuenta: {
            create: [
              { nombre: 'Efectivo', comportamiento: 'NORMAL' },
              { nombre: 'Banco', comportamiento: 'NORMAL' },
              { nombre: 'Tarjeta de Débito', comportamiento: 'NORMAL' },
              { nombre: 'Ahorro', comportamiento: 'NORMAL' },
              { nombre: 'Inversión', comportamiento: 'NORMAL' },
              {
                nombre: 'Tarjeta de Crédito',
                comportamiento: 'TARJETA_CREDITO',
              },
              { nombre: 'Deuda', comportamiento: 'DEUDA' },
            ],
          },

          consentimientos: {
            create: [
              {
                tipo: 'TERMINOS',
                version: '1.0',
              },
              {
                tipo: 'PRIVACIDAD',
                version: '1.0',
              },
            ],
          },
        },
      });

      const { contrasenaHash: _, ...usuarioSinContrasena } = usuario;

      return usuarioSinContrasena;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
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

    let contrasenaValida: boolean;

    try {
      contrasenaValida = await argon2.verify(
        usuario.contrasenaHash,
        datos.contrasena,
      );
    } catch {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    const token = await this.jwtService.signAsync(payload);

    return { access_token: token };
  }
}
