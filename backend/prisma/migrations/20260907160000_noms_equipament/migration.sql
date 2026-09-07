-- CreateTable
CREATE TABLE "NomEquipament" (
    "id" TEXT NOT NULL,
    "tipus" "TipusEquipament" NOT NULL,
    "nom" TEXT NOT NULL,
    "agrupacioId" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NomEquipament_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NomEquipament_tipus_nom_agrupacioId_key" ON "NomEquipament"("tipus", "nom", "agrupacioId");

-- AddForeignKey
ALTER TABLE "NomEquipament" ADD CONSTRAINT "NomEquipament_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
