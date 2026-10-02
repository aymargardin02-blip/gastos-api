import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module.js';
import { PerfilController } from './perfil.controller.js';
import { PerfilService } from './perfil.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PerfilController],
  providers: [PerfilService],
})
export class PerfilModule {}
