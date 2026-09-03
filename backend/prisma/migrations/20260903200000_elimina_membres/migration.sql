-- DropForeignKey
ALTER TABLE "DocumentMembre" DROP CONSTRAINT "DocumentMembre_membreId_fkey";

-- DropForeignKey
ALTER TABLE "FormacioMembre" DROP CONSTRAINT "FormacioMembre_formacioId_fkey";

-- DropForeignKey
ALTER TABLE "FormacioMembre" DROP CONSTRAINT "FormacioMembre_membreId_fkey";

-- DropForeignKey
ALTER TABLE "Membre" DROP CONSTRAINT "Membre_agrupacioId_fkey";

-- DropTable
DROP TABLE "DocumentMembre";

-- DropTable
DROP TABLE "FormacioMembre";

-- DropTable
DROP TABLE "Membre";

-- DropEnum
DROP TYPE "EstatDocMembre";

-- DropEnum
DROP TYPE "EstatFormacio";

-- DropEnum
DROP TYPE "TipusDocMembre";
