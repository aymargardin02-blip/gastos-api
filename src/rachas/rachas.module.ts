import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module.js';
import { RachasController } from './rachas.controller.js';
import { RachasService } from './rachas.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RachasController],
  providers: [RachasService],
  exports: [RachasService],
})
export class RachasModule {}
