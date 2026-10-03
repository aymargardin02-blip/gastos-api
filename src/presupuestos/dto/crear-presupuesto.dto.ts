import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoPresupuesto } from '../../generated/prisma/enums.js';

class CrearLimitePresupuestoDto {
  @IsInt()
  @IsPositive()
  categoriaId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limite: number;
}

export class CrearPresupuestoDto {
  @IsEnum(TipoPresupuesto)
  tipo: TipoPresupuesto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CrearLimitePresupuestoDto)
  limites: CrearLimitePresupuestoDto[];
}
