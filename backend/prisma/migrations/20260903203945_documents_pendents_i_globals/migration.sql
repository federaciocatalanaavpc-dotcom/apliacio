-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_agrupacioId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "pendent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "agrupacioId" DROP NOT NULL,
ALTER COLUMN "fitxerUrl" DROP NOT NULL,
ALTER COLUMN "fitxerNom" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
