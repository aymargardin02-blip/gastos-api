import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearCuentaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(100, { message: 'El nombre es demasiado largo' })
  nombre: string;

  @IsInt()
  @IsPositive()
  tipoCuentaId: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limiteCredito?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaCorte?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaPago?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  tasaInteres?: number;

  @IsOptional()
  @IsBoolean()
  tieneInteres?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  montoOriginal?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  cuentaPagoId?: number;
}
