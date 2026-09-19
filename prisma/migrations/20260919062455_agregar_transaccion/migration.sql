-- CreateTable
CREATE TABLE "transacciones" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
