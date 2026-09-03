-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "tipus" TEXT;

-- CreateTable
CREATE TABLE "TipusVehicle" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipusVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipusVehicle_nom_key" ON "TipusVehicle"("nom");
