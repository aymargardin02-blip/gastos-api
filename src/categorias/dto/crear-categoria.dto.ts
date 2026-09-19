import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TipoMovimiento } from '../../generated/prisma/enums.js';

export class CrearCategoriaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;
}