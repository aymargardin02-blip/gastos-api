-- CreateTable
CREATE TABLE "perfiles_sociales" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nombreUsuario" VARCHAR(15) NOT NULL,
    "descripcion" VARCHAR(160),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfiles_sociales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferencias_privacidad" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "participarRanking" BOOLEAN NOT NULL DEFAULT true,
    "mostrarRacha" BOOLEAN NOT NULL DEFAULT true,
    "perfilPublico" BOOLEAN NOT NULL DEFAULT true,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferencias_privacidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_sociales_usuarioId_key" ON "perfiles_sociales"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_sociales_nombreUsuario_key" ON "perfiles_sociales"("nombreUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "preferencias_privacidad_usuarioId_key" ON "preferencias_privacidad"("usuarioId");

-- AddForeignKey
ALTER TABLE "perfiles_sociales" ADD CONSTRAINT "perfiles_sociales_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferencias_privacidad" ADD CONSTRAINT "preferencias_privacidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
