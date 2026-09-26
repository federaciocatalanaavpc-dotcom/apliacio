-- CreateEnum
CREATE TYPE "RespostaAvis" AS ENUM ('VAIG', 'NO_PUC');

-- AlterTable
ALTER TABLE "Avis" ADD COLUMN "demanaResposta" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LecturaAvis" (
    "id" TEXT NOT NULL,
    "avisId" TEXT NOT NULL,
    "usuariId" TEXT NOT NULL,
    "llegitEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resposta" "RespostaAvis",
    "respostaEl" TIMESTAMP(3),

    CONSTRAINT "LecturaAvis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LecturaAvis_avisId_usuariId_key" ON "LecturaAvis"("avisId", "usuariId");

-- AddForeignKey
ALTER TABLE "LecturaAvis" ADD CONSTRAINT "LecturaAvis_avisId_fkey" FOREIGN KEY ("avisId") REFERENCES "Avis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaAvis" ADD CONSTRAINT "LecturaAvis_usuariId_fkey" FOREIGN KEY ("usuariId") REFERENCES "Usuari"("id") ON DELETE CASCADE ON UPDATE CASCADE;
