import { IsBoolean, IsDefined } from 'class-validator';

export class ActualizarPrivacidadDto {
  @IsDefined()
  @IsBoolean()
  participarRanking: boolean;

  @IsDefined()
  @IsBoolean()
  mostrarRacha: boolean;

  @IsDefined()
  @IsBoolean()
  perfilPublico: boolean;
}
