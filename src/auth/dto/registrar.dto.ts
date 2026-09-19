import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegistrarDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  contrasena: string;
}