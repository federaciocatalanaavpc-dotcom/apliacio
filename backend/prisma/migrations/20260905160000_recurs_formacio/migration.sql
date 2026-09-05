-- DropForeignKey (Formacio -> Agrupacio)
ALTER TABLE "Formacio" DROP CONSTRAINT IF EXISTS "Formacio_agrupacioId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Formacio";

-- CreateTable
CREATE TABLE "RecursFormacio" (
    "id" TEXT NOT NULL,
    "titol" TEXT NOT NULL,
    "url" TEXT,
    "fitxerNom" TEXT,
    "fitxerContingut" BYTEA,
    "fitxerMimeType" TEXT,
    "pujatPerId" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecursFormacio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecursFormacio" ADD CONSTRAINT "RecursFormacio_pujatPerId_fkey" FOREIGN KEY ("pujatPerId") REFERENCES "Usuari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
