import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma.service.js';

describe('Perfil (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const email = `perfil.e2e.${Date.now()}@test.com`;

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
        nombre: 'Usuario Perfil E2E',
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
  });

  afterAll(async () => {
    await prisma.preferenciaPrivacidad.deleteMany({
      where: {
        usuario: {
          email,
        },
      },
    });

    await prisma.perfilSocial.deleteMany({
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

    await prisma.tipoCuenta.deleteMany({
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

  it('GET /perfil devuelve preferencias iniciales', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/perfil')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: expect.any(Number),
      perfilSocial: null,
      preferenciaPrivacidad: {
        participarRanking: true,
        mostrarRacha: true,
        perfilPublico: true,
      },
    });
  });

  it('PATCH /perfil crea el perfil social', async () => {
    const respuesta = await request(app.getHttpServer())
      .patch('/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombreUsuario: 'usuario_e2e',
        descripcion: 'Mejorando mis hábitos financieros',
      })
      .expect(200);

    expect(respuesta.body).toEqual({
      nombreUsuario: 'usuario_e2e',
      descripcion: 'Mejorando mis hábitos financieros',
    });
  });

  it('PATCH /perfil actualiza el perfil social', async () => {
    const respuesta = await request(app.getHttpServer())
      .patch('/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombreUsuario: 'usuario_e2e_2',
        descripcion: 'Nueva descripción',
      })
      .expect(200);

    expect(respuesta.body).toEqual({
      nombreUsuario: 'usuario_e2e_2',
      descripcion: 'Nueva descripción',
    });
  });

  it('PATCH /perfil/privacidad actualiza las preferencias', async () => {
    const respuesta = await request(app.getHttpServer())
      .patch('/perfil/privacidad')
      .set('Authorization', `Bearer ${token}`)
      .send({
        participarRanking: false,
        mostrarRacha: true,
        perfilPublico: false,
      })
      .expect(200);

    expect(respuesta.body).toEqual({
      participarRanking: false,
      mostrarRacha: true,
      perfilPublico: false,
    });
  });

  it('PATCH /perfil rechaza un nombre de usuario inválido', async () => {
    await request(app.getHttpServer())
      .patch('/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombreUsuario: 'usuario invalido!',
        descripcion: 'Descripción',
      })
      .expect(400);
  });

  it('PATCH /perfil rechaza un nombre de usuario demasiado largo', async () => {
    await request(app.getHttpServer())
      .patch('/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombreUsuario: 'usuario_demasiado_largo',
        descripcion: 'Descripción',
      })
      .expect(400);
  });

  it('PATCH /perfil rechaza un nombre de usuario duplicado', async () => {
    const emailOtro = `perfil.e2e.otro.${Date.now()}@test.com`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombre: 'Otro usuario',
        email: emailOtro,
        contrasena: 'clave12345',
        aceptaTerminos: true,
        aceptaPrivacidad: true,
      })
      .expect(201);

    const loginOtro = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: emailOtro,
        contrasena: 'clave12345',
      })
      .expect(200);

    const tokenOtro = loginOtro.body.access_token;

    await request(app.getHttpServer())
      .patch('/perfil')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .send({
        nombreUsuario: 'usuario_e2e_2',
        descripcion: 'Otro perfil',
      })
      .expect(409);

    await prisma.preferenciaPrivacidad.deleteMany({
      where: {
        usuario: {
          email: emailOtro,
        },
      },
    });

    await prisma.consentimiento.deleteMany({
      where: {
        usuario: {
          email: emailOtro,
        },
      },
    });

    await prisma.tipoCuenta.deleteMany({
      where: {
        usuario: {
          email: emailOtro,
        },
      },
    });

    await prisma.usuario.deleteMany({
      where: {
        email: emailOtro,
      },
    });
  });
});
