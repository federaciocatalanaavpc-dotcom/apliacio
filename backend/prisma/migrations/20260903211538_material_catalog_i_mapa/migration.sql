-- AlterTable
ALTER TABLE "Agrupacio" ADD COLUMN     "latitud" DOUBLE PRECISION,
ADD COLUMN     "longitud" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "TipusMaterial" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipusMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipusMaterial_nom_key" ON "TipusMaterial"("nom");
