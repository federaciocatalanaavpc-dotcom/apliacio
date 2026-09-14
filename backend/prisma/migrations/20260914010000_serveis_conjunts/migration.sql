ALTER TABLE "Servei" ADD COLUMN "conjunt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Servei" ADD COLUMN "versioCoordinacio" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "ParticipacioServei" (
 "serveiId" TEXT NOT NULL, "agrupacioId" TEXT NOT NULL, "coordinadora" BOOLEAN NOT NULL DEFAULT false,
 CONSTRAINT "ParticipacioServei_pkey" PRIMARY KEY ("serveiId", "agrupacioId"),
 CONSTRAINT "ParticipacioServei_serveiId_fkey" FOREIGN KEY ("serveiId") REFERENCES "Servei"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "ParticipacioServei_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ParticipacioServei_agrupacioId_idx" ON "ParticipacioServei"("agrupacioId");
