-- CreateTable
CREATE TABLE "Caducitat" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "materialId" TEXT,
    "concepte" TEXT NOT NULL,
    "dataCaducitat" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "ultimLlindar" INTEGER,
    "ultimAvisEl" TIMESTAMP(3),
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Caducitat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Caducitat" ADD CONSTRAINT "Caducitat_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caducitat" ADD CONSTRAINT "Caducitat_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caducitat" ADD CONSTRAINT "Caducitat_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
