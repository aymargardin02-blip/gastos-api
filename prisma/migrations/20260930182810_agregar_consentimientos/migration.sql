-- CreateEnum
CREATE TYPE "TipoConsentimiento" AS ENUM ('TERMINOS', 'PRIVACIDAD');

-- CreateTable
CREATE TABLE "consentimientos" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" "TipoConsentimiento" NOT NULL,
    "version" TEXT NOT NULL,
    "aceptadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consentimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consentimientos_usuarioId_idx" ON "consentimientos"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "consentimientos_usuarioId_tipo_version_key" ON "consentimientos"("usuarioId", "tipo", "version");

-- AddForeignKey
ALTER TABLE "consentimientos" ADD CONSTRAINT "consentimientos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
