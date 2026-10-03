-- AlterTable
ALTER TABLE "transacciones" ADD COLUMN     "registradaEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "zonaHoraria" TEXT NOT NULL DEFAULT 'America/Panama';

-- CreateTable
CREATE TABLE "rachas" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "rachaActual" INTEGER NOT NULL DEFAULT 0,
    "mejorRacha" INTEGER NOT NULL DEFAULT 0,
    "ultimoDiaRegistro" TIMESTAMP(3),
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rachas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rachas_usuarioId_key" ON "rachas"("usuarioId");

-- AddForeignKey
ALTER TABLE "rachas" ADD CONSTRAINT "rachas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
