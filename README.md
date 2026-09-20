# Gastos API

API REST para gestionar ingresos y gastos personales, construida con **NestJS**, **TypeScript**, **Prisma** y **PostgreSQL**. Cada usuario se registra, crea sus propias categorías, registra transacciones (ingresos y gastos) y consulta su balance.

![CI](https://github.com/aymargardin02-blip/gastos-api/actions/workflows/ci.yml/badge.svg)

**Demo en producción**

- API: https://gastos-api-r7db.onrender.com
- Documentación interactiva (Swagger): https://gastos-api-r7db.onrender.com/api

> La API está alojada en un plan gratuito: si lleva un rato sin recibir peticiones, la primera puede tardar en responder mientras el servicio se reactiva.

## Funcionalidades

- Registro e inicio de sesión con **JWT**. Contraseñas cifradas con **Argon2id**.
- **Categorías** de ingresos y de gastos (CRUD).
- **Transacciones** (CRUD) con filtros por tipo, categoría y rango de fechas, y **paginación**.
- **Balance** de ingresos, gastos y diferencia, con filtro por fechas.
- **Aislamiento por usuario**: cada persona solo accede a sus propios datos.
- Validación estricta de entradas y códigos de estado coherentes.
- Documentación **Swagger/OpenAPI** con autenticación Bearer.
- Seguridad: cabeceras con **helmet**, límite de peticiones y CORS.
- **23 pruebas automáticas** (12 unitarias y 11 e2e) ejecutadas en **GitHub Actions**.
- **Docker** (imagen multi-etapa) y despliegue en Render con base de datos en Neon.

## Tecnologías

| Área | Tecnología |
|---|---|
| Framework | NestJS 12 (TypeScript, módulos ESM) |
| Base de datos | PostgreSQL |
| ORM | Prisma 7 con adaptador `pg` |
| Autenticación | JWT (`@nestjs/jwt`, Passport) y Argon2id |
| Validación | class-validator y class-transformer |
| Documentación | Swagger / OpenAPI (`@nestjs/swagger`) |
| Seguridad | helmet, `@nestjs/throttler`, CORS |
| Pruebas | Vitest (unitarias y e2e) |
| CI | GitHub Actions |
| Contenedores | Docker (multi-etapa, `node:24-slim`) |
| Producción | Render (API) y Neon (PostgreSQL) |

## Probarla rápido con Swagger

1. Abre la documentación: https://gastos-api-r7db.onrender.com/api
2. `POST /auth/register`: crea un usuario de prueba (usa una contraseña que no sea real; mínimo 8 caracteres).
3. `POST /auth/login`: copia el `access_token` de la respuesta.
4. Pulsa **Authorize** y pega el token.
5. Crea una categoría con `POST /categorias` y una transacción con `POST /transacciones`.
6. Consulta `GET /balance`.

## Instalación local

### Requisitos

- Node.js 24 LTS (desarrollado con la 24.21)
- PostgreSQL

### Pasos

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone https://github.com/aymargardin02-blip/gastos-api.git
   cd gastos-api
   npm install
   ```

2. Crea una base de datos PostgreSQL vacía (por ejemplo, `gastos_db`).

3. Copia la plantilla de variables de entorno y complétala:

   ```bash
   cp .env.example .env
   ```

   En PowerShell: `Copy-Item .env.example .env`

4. Aplica las migraciones y genera el cliente de Prisma:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. Arranca el servidor en modo desarrollo:

   ```bash
   npm run start:dev
   ```

La API queda en http://localhost:3000 y Swagger en http://localhost:3000/api.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL, por ejemplo `postgresql://usuario:contrasena@localhost:5432/gastos_db` |
| `JWT_SECRET` | Clave para firmar los tokens. Debe ser larga y aleatoria |
| `PORT` | Puerto del servidor (opcional; por defecto 3000) |

Para generar un `JWT_SECRET` seguro:

```bash
node -p "require('crypto').randomBytes(48).toString('hex')"
```

El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

## Endpoints

Todos, salvo `/salud`, `/auth/register` y `/auth/login`, requieren la cabecera `Authorization: Bearer <token>`.

| Método y ruta | Descripción |
|---|---|
| `GET /salud` | Comprobación de estado |
| `POST /auth/register` | Crea un usuario (409 si el email ya existe) |
| `POST /auth/login` | Devuelve el `access_token` |
| `GET /categorias` | Lista tus categorías |
| `POST /categorias` | Crea una categoría |
| `PATCH /categorias/:id` | Modifica una categoría |
| `DELETE /categorias/:id` | Elimina una categoría |
| `GET /transacciones` | Lista con filtros (`tipo`, `categoriaId`, `desde`, `hasta`) y paginación (`pagina`, `limite`, máximo 100) |
| `GET /transacciones/:id` | Muestra una transacción |
| `POST /transacciones` | Crea una transacción |
| `PATCH /transacciones/:id` | Modifica una transacción |
| `DELETE /transacciones/:id` | Elimina una transacción |
| `GET /balance` | Ingresos, gastos y balance, con `desde` y `hasta` opcionales |

El registro y el login están limitados a 5 peticiones por minuto; el resto de la API, a 100 por minuto.

## Ejemplos con curl

```bash
API=http://localhost:3000

# Registro
curl -X POST $API/auth/register -H "Content-Type: application/json" \
  -d '{"nombre":"Ana","email":"ana@ejemplo.com","contrasena":"clave-de-prueba-123"}'

# Login (devuelve access_token)
curl -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@ejemplo.com","contrasena":"clave-de-prueba-123"}'

TOKEN="pega_aqui_el_access_token"

# Crear una categoría
curl -X POST $API/categorias -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nombre":"Comida","tipo":"GASTO"}'

# Crear una transacción
curl -X POST $API/transacciones -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tipo":"GASTO","monto":12.5,"descripcion":"Almuerzo","fecha":"2026-09-20","categoriaId":1}'

# Listar con filtros y paginación
curl "$API/transacciones?tipo=GASTO&desde=2026-09-01&hasta=2026-09-30&pagina=1&limite=10" \
  -H "Authorization: Bearer $TOKEN"

# Balance
curl "$API/balance?desde=2026-09-01&hasta=2026-09-30" -H "Authorization: Bearer $TOKEN"
```

Respuesta de ejemplo de `GET /balance`:

```json
{
  "desde": "2026-09-01",
  "hasta": "2026-09-30",
  "ingresos": "500.00",
  "gastos": "12.50",
  "balance": "487.50"
}
```

En PowerShell, `curl` es un alias de otro comando: usa `curl.exe` o prueba la API desde Swagger.

## Pruebas

```bash
npm run test        # pruebas unitarias
npm run test:e2e    # pruebas end-to-end
```

- Las **unitarias** simulan `PrismaService`, así que no necesitan base de datos.
- Las **e2e** necesitan una base de datos de pruebas aparte (por ejemplo, `gastos_test`) con las migraciones aplicadas y sus variables en un archivo `.env.test.local` (no se sube al repositorio). Nunca se ejecutan contra la base de desarrollo ni la de producción.
- En **GitHub Actions**, un servicio PostgreSQL efímero hace todo esto automáticamente en cada push.

## Estructura del proyecto

```
gastos-api/
├─ .github/workflows/ci.yml     # integración continua
├─ prisma/
│  ├─ schema.prisma             # modelos y enums
│  └─ migrations/               # historial de migraciones
├─ src/
│  ├─ auth/                     # registro, login y estrategia JWT
│  ├─ categorias/               # CRUD de categorías
│  ├─ transacciones/            # CRUD de transacciones y balance
│  ├─ prisma.service.ts         # cliente de Prisma
│  ├─ prisma.module.ts
│  ├─ app.module.ts
│  └─ main.ts                   # arranque, validación, Swagger y seguridad
├─ test/                        # pruebas e2e
├─ Dockerfile
├─ prisma7.config.ts
├─ vitest.config.ts
├─ vitest.config.e2e.ts
└─ .env.example
```

## Decisiones técnicas

- **Aislamiento por usuario, con 404 en lugar de 403.** El identificador del usuario sale siempre del token, nunca del cuerpo de la petición. Si un recurso pertenece a otra persona, la API responde 404, para no revelar que existe en otra cuenta. Al crear una transacción también se comprueba que la categoría sea del propio usuario.
- **Dinero con `Decimal`, nunca `float`.** Los montos se guardan con precisión exacta (12 dígitos, 2 decimales). Se rechazan con 400 los importes con más de 2 decimales en lugar de redondearlos en silencio. El balance se calcula con aritmética decimal y se devuelve como texto (`"487.50"`) para no perder precisión en JSON.
- **Regla de negocio:** el tipo de una transacción debe coincidir con el de su categoría. En una actualización parcial se valida el estado final, no solo los campos enviados.
- **Protección contra *mass assignment*.** El `ValidationPipe` global usa `whitelist: true`, así que cualquier campo no declarado en un DTO se descarta antes de llegar a la base de datos.
- **Argon2id** para las contraseñas, recomendado hoy sobre bcrypt para proyectos nuevos. El login responde siempre con el mismo mensaje genérico ante credenciales incorrectas y trata un hash inválido como un 401, no como un 500.
- **Prisma 7 fijado a propósito** (no se usa la 8, aún muy reciente y con una API distinta). Se usa el generador `prisma-client`, que produce TypeScript plano dentro de `src/generated`, compilado junto con el resto del proyecto.
- **Paginación acotada** (máximo 100 por página) y orden estable (fecha descendente y desempate por `id`).
- **Seguridad en capas:** helmet, límite global de peticiones y un límite más estricto en registro y login para frenar la fuerza bruta.
- **Producción con Neon y Render.** La base de datos gratuita de Render caduca a los 30 días, así que PostgreSQL vive en Neon (plan gratuito permanente) y la API en Render.
- **Docker multi-etapa** sobre `node:24-slim` (Debian), que evita los problemas conocidos de Prisma con Alpine. La imagen no aplica migraciones: se ejecutan aparte contra la base de producción.
- **Dockerfile validado en CI.** No se puede probar en el equipo de desarrollo, así que cada push construye la imagen en GitHub Actions.

## Despliegue

- **API:** Render, servicio web con entorno Docker.
- **Base de datos:** Neon (PostgreSQL serverless).
- **Variables de entorno en Render:** `DATABASE_URL` y `JWT_SECRET`.
- **Migraciones:** se aplican manualmente contra la base de producción con `npx prisma migrate deploy` (con `DATABASE_URL` apuntando a esa base).

## Limitaciones conocidas y mejoras futuras

- `npm audit` reporta 4 vulnerabilidades altas en dependencias indirectas de la CLI de Prisma (`deepmerge-ts` y `mysql2`), que no se usan en tiempo de ejecución. Corregirlas obligaría a bajar Prisma a la versión 6, así que se dejan documentadas como riesgo aceptado.
- El filtro `hasta` funciona bien con fechas sin hora; si se guardaran horas, `hasta=2026-09-30` excluiría lo ocurrido después de la medianoche de ese día.
- CORS está abierto porque todavía no hay un frontend propio; conviene restringirlo al dominio del cliente cuando exista.
- Los mensajes de validación salen en inglés (los genera `class-validator`).
- Ideas: presupuestos mensuales por categoría, reportes por categoría y por mes, cuentas (efectivo, banco, tarjeta) y un frontend.

## Autor

Aymar Gardin · [LinkedIn](https://www.linkedin.com/) · aymargardin02@gmail.com