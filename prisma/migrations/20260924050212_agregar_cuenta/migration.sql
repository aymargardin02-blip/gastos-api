-- CreateTable
CREATE TABLE "cuentas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "archivada" BOOLEAN NOT NULL DEFAULT false,
    "limiteCredito" DECIMAL(12,2),
    "diaCorte" INTEGER,
    "diaPago" INTEGER,
    "tasaInteres" DECIMAL(5,2),
    "tieneInteres" BOOLEAN,
    "montoOriginal" DECIMAL(12,2),
    "cuentaPagoId" INTEGER,
    "tipoCuentaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_cuentaPagoId_fkey" FOREIGN KEY ("cuentaPagoId") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_tipoCuentaId_fkey" FOREIGN KEY ("tipoCuentaId") REFERENCES "tipos_cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
