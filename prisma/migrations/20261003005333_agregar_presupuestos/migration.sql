-- CreateEnum
CREATE TYPE "TipoPresupuesto" AS ENUM ('MENSUAL', 'QUINCENAL');

-- CreateTable
CREATE TABLE "presupuestos" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" "TipoPresupuesto" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limites_presupuesto" (
    "id" SERIAL NOT NULL,
    "presupuestoId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "limite" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "limites_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "limites_presupuesto_categoriaId_idx" ON "limites_presupuesto"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "limites_presupuesto_presupuestoId_categoriaId_key" ON "limites_presupuesto"("presupuestoId", "categoriaId");

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limites_presupuesto" ADD CONSTRAINT "limites_presupuesto_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limites_presupuesto" ADD CONSTRAINT "limites_presupuesto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
