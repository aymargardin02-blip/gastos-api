import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma.service.js';

describe('Rachas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const sufijo = Date.now();
  const email = `rachas.e2e.${sufijo}@test.com`;

  let token: string;
  let categoriaId: number;
  let cuentaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = moduleFixture.get(PrismaService);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombre: 'Rachas E2E',
        email,
        contrasena: 'clave12345',
        aceptaTerminos: true,
        aceptaPrivacidad: true,
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        contrasena: 'clave12345',
      })
      .expect(200);

    token = login.body.access_token;

    const tipoEfectivo = await prisma.tipoCuenta.findFirstOrThrow({
      where: {
        nombre: 'Efectivo',
        usuario: {
          email,
        },
      },
    });

    const cuenta = await request(app.getHttpServer())
      .post('/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Efectivo Rachas',
        tipoCuentaId: tipoEfectivo.id,
      })
      .expect(201);

    cuentaId = cuenta.body.id;

    const categoria = await request(app.getHttpServer())
      .post('/categorias')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Gastos Rachas',
        tipo: 'GASTO',
      })
      .expect(201);

    categoriaId = categoria.body.id;
  });

  afterAll(async () => {
    await prisma.transaccion.deleteMany({
      where: {
        usuario: {
          email,
        },
      },
    });

    await prisma.racha.deleteMany({
      where: {
        usuario: {
          email,
        },
      },
    });

    await prisma.cuenta.deleteMany({
      where: {
        usuario: {
          email,
        },
      },
    });

    await prisma.tipoCuenta.deleteMany({
      where: {
        usuario: {
          email,
        },
      },
    });

    await prisma.categoria.deleteMany({
      where: {
        usuario: {
          email,
        },
      },
    });

    await prisma.preferenciaPrivacidad.deleteMany({
      where: {
        usuario: {
          email,
        },
      },
    });

    await prisma.consentimiento.deleteMany({
      where: {
        usuario: {
          email,
        },
      },
    });

    await prisma.usuario.deleteMany({
      where: {
        email,
      },
    });

    await app.close();
  });

  it('GET /rachas sin token responde 401', async () => {
    await request(app.getHttpServer())
      .get('/rachas')
      .expect(401);
  });

  it('GET /rachas inicialmente devuelve racha 0', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/rachas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(respuesta.body.rachaActual).toBe(0);
    expect(respuesta.body.mejorRacha).toBe(0);
    expect(respuesta.body.ultimoDiaRegistro).toBeNull();
  });

  it('crear una transacción crea una racha de un día', async () => {
    await request(app.getHttpServer())
      .post('/transacciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'GASTO',
        monto: 20,
        descripcion: 'Gasto de prueba',
        fecha: '2026-10-02',
        categoriaId,
        cuentaId,
      })
      .expect(201);

    const respuesta = await request(app.getHttpServer())
      .get('/rachas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(respuesta.body.rachaActual).toBe(1);
    expect(respuesta.body.mejorRacha).toBe(1);
    expect(respuesta.body.ultimoDiaRegistro).toBeDefined();
  });

  it('dos transacciones en el mismo día cuentan como un solo día', async () => {
    await request(app.getHttpServer())
      .post('/transacciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'GASTO',
        monto: 15,
        descripcion: 'Segundo gasto del día',
        fecha: '2026-10-02',
        categoriaId,
        cuentaId,
      })
      .expect(201);

    const respuesta = await request(app.getHttpServer())
      .get('/rachas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(respuesta.body.rachaActual).toBe(1);
    expect(respuesta.body.mejorRacha).toBe(1);
  });
});
