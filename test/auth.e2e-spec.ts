import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma.service.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emailPrueba = `prueba.e2e.${Date.now()}@test.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: emailPrueba } });
    await app.close();
  });

  it('POST /auth/register crea un usuario nuevo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombre: 'Usuario de prueba',
        email: emailPrueba,
        contrasena: 'clave12345',
      })
      .expect(201);

    expect(respuesta.body).toMatchObject({
      nombre: 'Usuario de prueba',
      email: emailPrueba,
    });
    expect(respuesta.body.contrasenaHash).toBeUndefined();
  });

  it('POST /auth/register rechaza un email repetido', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombre: 'Otro nombre',
        email: emailPrueba,
        contrasena: 'clave12345',
      })
      .expect(409);
  });

  it('POST /auth/login devuelve un token con credenciales correctas', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: emailPrueba,
        contrasena: 'clave12345',
      })
      .expect(200);

    expect(respuesta.body.access_token).toBeDefined();
  });

  it('POST /auth/login rechaza una contraseña incorrecta', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: emailPrueba,
        contrasena: 'clave_incorrecta',
      })
      .expect(401);
  });
});
