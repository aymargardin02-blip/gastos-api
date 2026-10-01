import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegistrarDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  contrasena: string;

  @IsDefined()
  @IsBoolean()
  aceptaTerminos: boolean;

  @IsDefined()
  @IsBoolean()
  aceptaPrivacidad: boolean;
}
