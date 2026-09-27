-- DropForeignKey
ALTER TABLE "transacciones" DROP CONSTRAINT "transacciones_categoriaId_fkey";

-- AlterTable
ALTER TABLE "transacciones" ALTER COLUMN "categoriaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
