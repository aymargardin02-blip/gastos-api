import { PartialType } from '@nestjs/mapped-types';
import { CrearTransaccionDto } from './crear-transaccion.dto.js';

export class ActualizarTransaccionDto extends PartialType(CrearTransaccionDto) {}
