-- TipusServei: passa a poder ser propi d'una associació
ALTER TABLE "TipusServei" ADD COLUMN "agrupacioId" TEXT;
DROP INDEX "TipusServei_nom_key";
CREATE UNIQUE INDEX "TipusServei_nom_agrupacioId_key" ON "TipusServei"("nom", "agrupacioId");
ALTER TABLE "TipusServei" ADD CONSTRAINT "TipusServei_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CategoriaServei: passa a poder ser pròpia d'una associació
ALTER TABLE "CategoriaServei" ADD COLUMN "agrupacioId" TEXT;
DROP INDEX "CategoriaServei_nom_key";
CREATE UNIQUE INDEX "CategoriaServei_nom_agrupacioId_key" ON "CategoriaServei"("nom", "agrupacioId");
ALTER TABLE "CategoriaServei" ADD CONSTRAINT "CategoriaServei_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "LocalitatServei" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "agrupacioId" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalitatServei_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SollicitantServei" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "agrupacioId" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SollicitantServei_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalitatServei_nom_agrupacioId_key" ON "LocalitatServei"("nom", "agrupacioId");

-- CreateIndex
CREATE UNIQUE INDEX "SollicitantServei_nom_agrupacioId_key" ON "SollicitantServei"("nom", "agrupacioId");

-- AddForeignKey
ALTER TABLE "LocalitatServei" ADD CONSTRAINT "LocalitatServei_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SollicitantServei" ADD CONSTRAINT "SollicitantServei_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
