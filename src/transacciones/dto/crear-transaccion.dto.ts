import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { TipoMovimiento } from '../../generated/prisma/enums.js';

export class CrearTransaccionDto {
  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  @IsNumber()
  @IsPositive()
  monto: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDateString()
  fecha: string;

  @IsInt()
  @IsPositive()
  categoriaId: number;
}
