-- CreateEnum
CREATE TYPE "ComportamientoCuenta" AS ENUM ('NORMAL', 'TARJETA_CREDITO', 'DEUDA');

-- CreateTable
CREATE TABLE "tipos_cuenta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "comportamiento" "ComportamientoCuenta" NOT NULL,
    "archivado" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "tipos_cuenta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tipos_cuenta" ADD CONSTRAINT "tipos_cuenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
