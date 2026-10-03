import {
  IsNumber,
  IsPositive,
} from 'class-validator';

export class ActualizarPresupuestoDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limite: number;
}
