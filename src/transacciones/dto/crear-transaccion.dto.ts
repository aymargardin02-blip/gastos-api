import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TipoMovimiento } from '../../generated/prisma/enums.js';

export class CrearTransaccionDto {
  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  categoriaId?: number;

  @IsInt()
  @IsPositive()
  cuentaId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  cuentaDestinoId?: number;

  @IsOptional()
  @IsEnum(['CAPITAL', 'INTERES'])
  componenteDeuda?: 'CAPITAL' | 'INTERES';
}
