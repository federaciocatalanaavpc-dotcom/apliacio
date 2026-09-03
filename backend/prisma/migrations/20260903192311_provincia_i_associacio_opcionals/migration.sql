-- AlterTable
ALTER TABLE "Agrupacio" ADD COLUMN     "provincia" TEXT,
ALTER COLUMN "municipi" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Provincia" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_nom_key" ON "Provincia"("nom");
