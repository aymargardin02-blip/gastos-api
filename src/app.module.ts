import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TransaccionesModule } from './transacciones/transacciones.module.js';
// 1. Importamos el nuevo módulo
import { TiposCuentaModule } from './tipos-cuenta/tipos-cuenta.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    CategoriasModule,
    AuthModule,
    TransaccionesModule,
    // 2. Lo registramos aquí para que NestJS lo inicie
    TiposCuentaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
