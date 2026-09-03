-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('FEDERACIO', 'AGRUPACIO');

-- CreateEnum
CREATE TYPE "PropietatVehicle" AS ENUM ('PROPI', 'RENTING', 'CEDIT');

-- CreateEnum
CREATE TYPE "TipusDocMembre" AS ENUM ('DNI', 'CARNET_CONDUIR', 'CERTIFICAT_MEDIC', 'ASSEGURANCA', 'ALTRES');

-- CreateEnum
CREATE TYPE "EstatDocMembre" AS ENUM ('PENDENT', 'REBUT', 'CADUCAT');

-- CreateEnum
CREATE TYPE "EstatMaterial" AS ENUM ('OPERATIU', 'MANTENIMENT', 'BAIXA');

-- CreateEnum
CREATE TYPE "TipusDocument" AS ENUM ('ESTATUTS', 'ACTA', 'ALTRES');

-- CreateEnum
CREATE TYPE "EstatFormacio" AS ENUM ('PENDENT', 'COMPLETADA');

-- CreateTable
CREATE TABLE "Usuari" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "usuari" TEXT NOT NULL,
    "contrasenya" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agrupacioId" TEXT,

    CONSTRAINT "Usuari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agrupacio" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "municipi" TEXT NOT NULL,
    "comarca" TEXT,
    "adreca" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "president" TEXT,
    "dataFundacio" TIMESTAMP(3),
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agrupacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membre" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "cognoms" TEXT NOT NULL,
    "dni" TEXT,
    "dataNaixement" TIMESTAMP(3),
    "telefon" TEXT,
    "email" TEXT,
    "dataAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataBaixa" TIMESTAMP(3),
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentMembre" (
    "id" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "tipus" "TipusDocMembre" NOT NULL,
    "estat" "EstatDocMembre" NOT NULL DEFAULT 'PENDENT',
    "dataCaducitat" TIMESTAMP(3),
    "fitxerUrl" TEXT,
    "fitxerNom" TEXT,
    "notes" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "marca" TEXT,
    "model" TEXT,
    "propietat" "PropietatVehicle" NOT NULL,
    "empresaRenting" TEXT,
    "proximaItv" TIMESTAMP(3),
    "proximaRevisio" TIMESTAMP(3),
    "notes" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categoria" TEXT,
    "quantitat" INTEGER NOT NULL DEFAULT 0,
    "estat" "EstatMaterial" NOT NULL DEFAULT 'OPERATIU',
    "notes" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualitzatEl" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "tipus" "TipusDocument" NOT NULL,
    "titol" TEXT NOT NULL,
    "dataDocument" TIMESTAMP(3),
    "fitxerUrl" TEXT NOT NULL,
    "fitxerNom" TEXT NOT NULL,
    "pujatPerId" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formacio" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "descripcio" TEXT,
    "agrupacioId" TEXT,
    "dataProgramada" TIMESTAMP(3),
    "obligatoria" BOOLEAN NOT NULL DEFAULT false,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Formacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormacioMembre" (
    "id" TEXT NOT NULL,
    "formacioId" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "estat" "EstatFormacio" NOT NULL DEFAULT 'PENDENT',
    "dataCompletada" TIMESTAMP(3),

    CONSTRAINT "FormacioMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" TEXT NOT NULL,
    "titol" TEXT NOT NULL,
    "cos" TEXT NOT NULL,
    "agrupacioId" TEXT,
    "dataEnviament" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviat" BOOLEAN NOT NULL DEFAULT false,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscripcioPush" (
    "id" TEXT NOT NULL,
    "usuariId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscripcioPush_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuari_usuari_key" ON "Usuari"("usuari");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_matricula_key" ON "Vehicle"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "FormacioMembre_formacioId_membreId_key" ON "FormacioMembre"("formacioId", "membreId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscripcioPush_endpoint_key" ON "SubscripcioPush"("endpoint");

-- AddForeignKey
ALTER TABLE "Usuari" ADD CONSTRAINT "Usuari_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membre" ADD CONSTRAINT "Membre_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMembre" ADD CONSTRAINT "DocumentMembre_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_pujatPerId_fkey" FOREIGN KEY ("pujatPerId") REFERENCES "Usuari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formacio" ADD CONSTRAINT "Formacio_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormacioMembre" ADD CONSTRAINT "FormacioMembre_formacioId_fkey" FOREIGN KEY ("formacioId") REFERENCES "Formacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormacioMembre" ADD CONSTRAINT "FormacioMembre_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscripcioPush" ADD CONSTRAINT "SubscripcioPush_usuariId_fkey" FOREIGN KEY ("usuariId") REFERENCES "Usuari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
