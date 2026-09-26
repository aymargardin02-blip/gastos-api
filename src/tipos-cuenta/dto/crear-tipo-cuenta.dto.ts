import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ComportamientoCuenta } from '../../generated/prisma/client.js';
import { ApiProperty } from '@nestjs/swagger';

export class CrearTipoCuentaDto {
  @ApiProperty({ example: 'Criptomonedas' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(50, { message: 'El nombre es demasiado largo' })
  nombre: string;

  @ApiProperty({ enum: ComportamientoCuenta, example: ComportamientoCuenta.NORMAL })
  @IsEnum(ComportamientoCuenta, { message: 'El comportamiento debe ser NORMAL, TARJETA_CREDITO o DEUDA' })
  comportamiento: ComportamientoCuenta;
}
