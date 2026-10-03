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
import { TiposCuentaModule } from './tipos-cuenta/tipos-cuenta.module.js';
import { CuentasModule } from './cuentas/cuentas.module.js';
import { PerfilModule } from './perfil/perfil.module.js';
import { PresupuestosModule } from './presupuestos/presupuestos.module.js';

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
    TiposCuentaModule,
    CuentasModule,
    PerfilModule,
    PresupuestosModule,
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
