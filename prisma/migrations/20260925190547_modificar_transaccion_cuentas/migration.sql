/*
  Warnings:

  - Added the required column `cuentaId` to the `transacciones` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ComponenteDeuda" AS ENUM ('CAPITAL', 'INTERES');

-- AlterEnum
ALTER TYPE "TipoMovimiento" ADD VALUE 'TRANSFERENCIA';

-- AlterTable
ALTER TABLE "transacciones" ADD COLUMN     "componenteDeuda" "ComponenteDeuda",
ADD COLUMN     "cuentaDestinoId" INTEGER,
ADD COLUMN     "cuentaId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_cuentaDestinoId_fkey" FOREIGN KEY ("cuentaDestinoId") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
