-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'GASTO');

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
