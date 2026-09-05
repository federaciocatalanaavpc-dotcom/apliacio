-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'VOLUNTARI';

-- CreateEnum
CREATE TYPE "Disponibilitat" AS ENUM ('PRESENCIAL', 'IMMEDIATA', 'DIFERIDA', 'NO_DISPONIBLE');

-- CreateTable
CREATE TABLE "Voluntari" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "cognoms" TEXT NOT NULL,
    "telefon" TEXT,
    "dni" TEXT,
    "genere" TEXT,
    "dataNaixement" TIMESTAMP(3),
    "provincia" TEXT,
    "localitat" TEXT,
    "adreca" TEXT,
    "codiPostal" TEXT,
    "dataIngres" TIMESTAMP(3),
    "dataBaixa" TIMESTAMP(3),
    "numeroIdentificacio" TEXT,
    "indicatiu" TEXT,
    "carrec" TEXT,
    "altresEmails" TEXT,
    "altresAgrupacions" TEXT,
    "disponibilitat" "Disponibilitat" NOT NULL DEFAULT 'NO_DISPONIBLE',
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuariId" TEXT,

    CONSTRAINT "Voluntari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipusServei" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipusServei_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaServei" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoriaServei_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servei" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "titol" TEXT NOT NULL,
    "numeracio" TEXT,
    "maxAssistents" INTEGER,
    "collaboracioEmergencies" BOOLEAN NOT NULL DEFAULT false,
    "dataInici" TIMESTAMP(3) NOT NULL,
    "dataFi" TIMESTAMP(3) NOT NULL,
    "limitInscripcio" TIMESTAMP(3),
    "horaBase" TIMESTAMP(3),
    "horaSortida" TIMESTAMP(3),
    "tipus" TEXT,
    "categoria" TEXT,
    "localitat" TEXT,
    "sollicitant" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "adreca" TEXT,
    "descripcio" TEXT,
    "destinataris" TEXT,
    "arxivat" BOOLEAN NOT NULL DEFAULT false,
    "creatPerId" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servei_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistenciaServei" (
    "id" TEXT NOT NULL,
    "serveiId" TEXT NOT NULL,
    "voluntariId" TEXT NOT NULL,
    "confirmat" BOOLEAN NOT NULL DEFAULT false,
    "horaEntrada" TIMESTAMP(3),
    "horaSortida" TIMESTAMP(3),
    "horesRealitzades" DOUBLE PRECISION,
    "notes" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistenciaServei_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipusServei_nom_key" ON "TipusServei"("nom");
CREATE UNIQUE INDEX "CategoriaServei_nom_key" ON "CategoriaServei"("nom");
CREATE UNIQUE INDEX "Voluntari_usuariId_key" ON "Voluntari"("usuariId");
CREATE UNIQUE INDEX "AssistenciaServei_serveiId_voluntariId_key" ON "AssistenciaServei"("serveiId", "voluntariId");

-- AddForeignKey
ALTER TABLE "Voluntari" ADD CONSTRAINT "Voluntari_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Voluntari" ADD CONSTRAINT "Voluntari_usuariId_fkey" FOREIGN KEY ("usuariId") REFERENCES "Usuari"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Servei" ADD CONSTRAINT "Servei_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Servei" ADD CONSTRAINT "Servei_creatPerId_fkey" FOREIGN KEY ("creatPerId") REFERENCES "Usuari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssistenciaServei" ADD CONSTRAINT "AssistenciaServei_serveiId_fkey" FOREIGN KEY ("serveiId") REFERENCES "Servei"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistenciaServei" ADD CONSTRAINT "AssistenciaServei_voluntariId_fkey" FOREIGN KEY ("voluntariId") REFERENCES "Voluntari"("id") ON DELETE CASCADE ON UPDATE CASCADE;
