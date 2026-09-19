import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma.service.js';

describe('Transacciones (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const sufijo = Date.now();
  const emailAna = `ana.e2e.${sufijo}@test.com`;
  const emailBeto = `beto.e2e.${sufijo}@test.com`;

  let tokenAna: string;
  let tokenBeto: string;
  let categoriaAnaId: number;
  let categoriaBetoId: number;
  let transaccionAnaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    await request(app.getHttpServer()).post('/auth/register').send({
      nombre: 'Ana E2E',
      email: emailAna,
      contrasena: 'clave12345',
    });
    await request(app.getHttpServer()).post('/auth/register').send({
      nombre: 'Beto E2E',
      email: emailBeto,
      contrasena: 'clave12345',
    });

    const loginAna = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailAna, contrasena: 'clave12345' });
    tokenAna = loginAna.body.access_token;

    const loginBeto = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailBeto, contrasena: 'clave12345' });
    tokenBeto = loginBeto.body.access_token;

    const categoriaAna = await request(app.getHttpServer())
      .post('/categorias')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({ nombre: 'Gastos varios', tipo: 'GASTO' });
    categoriaAnaId = categoriaAna.body.id;

    const categoriaBeto = await request(app.getHttpServer())
      .post('/categorias')
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ nombre: 'Gastos de Beto', tipo: 'GASTO' });
    categoriaBetoId = categoriaBeto.body.id;
  });

  afterAll(async () => {
    await prisma.transaccion.deleteMany({
      where: { usuarioId: { in: [] } },
    }).catch(() => {});
    await prisma.transaccion.deleteMany({
      where: { categoriaId: { in: [categoriaAnaId, categoriaBetoId] } },
    });
    await prisma.categoria.deleteMany({
      where: { id: { in: [categoriaAnaId, categoriaBetoId] } },
    });
    await prisma.usuario.deleteMany({
      where: { email: { in: [emailAna, emailBeto] } },
    });
    await app.close();
  });

  it('POST /transacciones sin token responde 401', async () => {
    await request(app.getHttpServer())
      .post('/transacciones')
      .send({
        tipo: 'GASTO',
        monto: 20,
        fecha: '2026-09-19',
        categoriaId: categoriaAnaId,
      })
      .expect(401);
  });

  it('POST /transacciones con tipo distinto al de la categoria responde 400', async () => {
    await request(app.getHttpServer())
      .post('/transacciones')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({
        tipo: 'INGRESO',
        monto: 20,
        fecha: '2026-09-19',
        categoriaId: categoriaAnaId,
      })
      .expect(400);
  });

  it('POST /transacciones con categoria de otro usuario responde 404', async () => {
    await request(app.getHttpServer())
      .post('/transacciones')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({
        tipo: 'GASTO',
        monto: 20,
        fecha: '2026-09-19',
        categoriaId: categoriaBetoId,
      })
      .expect(404);
  });

  it('POST /transacciones crea la transaccion correctamente', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/transacciones')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({
        tipo: 'GASTO',
        monto: 20,
        descripcion: 'Almuerzo E2E',
        fecha: '2026-09-19',
        categoriaId: categoriaAnaId,
      })
      .expect(201);

    transaccionAnaId = respuesta.body.id;
    expect(respuesta.body.usuarioId).toBeDefined();
  });

  it('GET /transacciones/:id de otro usuario responde 404', async () => {
    await request(app.getHttpServer())
      .get(`/transacciones/${transaccionAnaId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .expect(404);
  });

  it('DELETE /transacciones/:id de otro usuario responde 404 y no la borra', async () => {
    await request(app.getHttpServer())
      .delete(`/transacciones/${transaccionAnaId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/transacciones/${transaccionAnaId}`)
      .set('Authorization', `Bearer ${tokenAna}`)
      .expect(200);
  });
});
