import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RachasService } from './rachas.service.js';

interface RequestConUsuario extends Request {
  user: {
    id: number;
    email: string;
    rol: string;
  };
}

@ApiTags('rachas')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('rachas')
export class RachasController {
  constructor(private readonly rachasService: RachasService) {}

  @Get()
  obtener(@Req() req: RequestConUsuario) {
    return this.rachasService.obtener(req.user.id);
  }
}
