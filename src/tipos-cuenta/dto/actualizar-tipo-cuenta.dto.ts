import { PartialType, PickType } from '@nestjs/swagger';
import { CrearTipoCuentaDto } from './crear-tipo-cuenta.dto.js';

export class ActualizarTipoCuentaDto extends PartialType(PickType(CrearTipoCuentaDto, ['nombre'] as const)) {}
