import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ActualizarPerfilDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'El nombre de usuario solo puede contener letras minúsculas, números y guion bajo',
  })
  nombreUsuario: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  descripcion?: string;
}
