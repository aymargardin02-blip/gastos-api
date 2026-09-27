import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma.service.js';

describe('Cuentas y transferencias (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const sufijo = Date.now();
  const email = `cuentas.e2e.${sufijo}@test.com`;

  let token: string;
  let tipoEfectivoId: number;
  let tipoTarjetaId: number;
  let categoriaIngresoId: number;
  let cuentaOrigenId: number;
  let cuentaDestinoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    await request(app.getHttpServer()).post('/auth/register').send({
      nombre: 'Usuario Cuentas E2E',
      email,
      contrasena: 'clave12345',
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, contrasena: 'clave12345' });
    token = login.body.access_token;

    const tipoEfectivo = await prisma.tipoCuenta.findFirstOrThrow({
      where: { nombre: 'Efectivo', usuario: { email } },
    });
    tipoEfectivoId = tipoEfectivo.id;

    const tipoTarjeta = await prisma.tipoCuenta.findFirstOrThrow({
      where: { nombre: 'Tarjeta de Crédito', usuario: { email } },
    });
    tipoTarjetaId = tipoTarjeta.id;

    const categoria = await request(app.getHttpServer())
      .post('/categorias')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Ingresos varios E2E', tipo: 'INGRESO' });
    categoriaIngresoId = categoria.body.id;
  });

  afterAll(async () => {
    await prisma.transaccion.deleteMany({
      where: { usuario: { email } },
    });
    await prisma.cuenta.deleteMany({
      where: { usuario: { email } },
    });
    await prisma.tipoCuenta.deleteMany({
      where: { usuario: { email } },
    });
    await prisma.categoria.deleteMany({
      where: { usuario: { email } },
    });
    await prisma.usuario.deleteMany({ where: { email } });
    await app.close();
  });

  it('POST /cuentas sin token responde 401', async () => {
    await request(app.getHttpServer())
      .post('/cuentas')
      .send({ nombre: 'Sin token', tipoCuentaId: tipoEfectivoId })
      .expect(401);
  });

  it('POST /cuentas crea una cuenta NORMAL correctamente', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Cuenta origen E2E', tipoCuentaId: tipoEfectivoId })
      .expect(201);

    cuentaOrigenId = respuesta.body.id;
    expect(respuesta.body.nombre).toBe('Cuenta origen E2E');
    expect(respuesta.body.archivada).toBe(false);
  });

  it('POST /cuentas crea una segunda cuenta NORMAL para transferir', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Cuenta destino E2E', tipoCuentaId: tipoEfectivoId })
      .expect(201);

    cuentaDestinoId = respuesta.body.id;
    expect(respuesta.body.nombre).toBe('Cuenta destino E2E');
  });

  it('POST /cuentas de tarjeta sin cuentaPagoId responde 400', async () => {
    await request(app.getHttpServer())
      .post('/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Visa incompleta',
        tipoCuentaId: tipoTarjetaId,
        limiteCredito: 1000,
        diaCorte: 15,
        diaPago: 5,
        tasaInteres: 2.5,
      })
      .expect(400);
  });

  it('POST /cuentas de tarjeta con todos los campos responde 201', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/cuentas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Visa E2E',
        tipoCuentaId: tipoTarjetaId,
        limiteCredito: 1000,
        diaCorte: 15,
        diaPago: 5,
        tasaInteres: 2.5,
        cuentaPagoId: cuentaOrigenId,
      })
      .expect(201);

    expect(respuesta.body.nombre).toBe('Visa E2E');
    expect(respuesta.body.cuentaPagoId).toBe(cuentaOrigenId);
  });

  it('POST /transacciones crea un INGRESO en la cuenta origen', async () => {
    await request(app.getHttpServer())
      .post('/transacciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'INGRESO',
        monto: 500,
        descripcion: 'Sueldo E2E',
        fecha: '2026-09-19',
        categoriaId: categoriaIngresoId,
        cuentaId: cuentaOrigenId,
      })
      .expect(201);
  });

  it('POST /transacciones crea una TRANSFERENCIA de origen a destino', async () => {
    await request(app.getHttpServer())
      .post('/transacciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'TRANSFERENCIA',
        monto: 100,
        descripcion: 'Ahorro E2E',
        fecha: '2026-09-19',
        cuentaId: cuentaOrigenId,
        cuentaDestinoId: cuentaDestinoId,
      })
      .expect(201);
  });

  it('GET /cuentas/:id/saldo refleja ingreso y transferencia en cada cuenta', async () => {
    const saldoOrigen = await request(app.getHttpServer())
      .get(`/cuentas/${cuentaOrigenId}/saldo`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(saldoOrigen.body).toEqual({
      cuentaId: cuentaOrigenId,
      saldo: 400,
      comportamiento: 'NORMAL',
    });

    const saldoDestino = await request(app.getHttpServer())
      .get(`/cuentas/${cuentaDestinoId}/saldo`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(saldoDestino.body).toEqual({
      cuentaId: cuentaDestinoId,
      saldo: 100,
      comportamiento: 'NORMAL',
    });
  });

  it('GET /balance excluye las transferencias del calculo', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/balance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      ingresos: '500.00',
      gastos: '0.00',
      balance: '500.00',
    });
  });

  it('POST /transacciones rechaza componenteDeuda hacia una cuenta NORMAL', async () => {
    await request(app.getHttpServer())
      .post('/transacciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'TRANSFERENCIA',
        monto: 50,
        fecha: '2026-09-19',
        cuentaId: cuentaOrigenId,
        cuentaDestinoId: cuentaDestinoId,
        componenteDeuda: 'CAPITAL',
      })
      .expect(400);
  });
});
