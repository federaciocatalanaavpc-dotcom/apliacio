-- AlterTable
ALTER TABLE "Voluntari" ADD COLUMN "consentimentDades" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RegistreAuditoria" (
    "id" TEXT NOT NULL,
    "usuariId" TEXT NOT NULL,
    "accio" TEXT NOT NULL,
    "entitat" TEXT NOT NULL,
    "entitatId" TEXT NOT NULL,
    "agrupacioId" TEXT,
    "detall" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistreAuditoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RegistreAuditoria" ADD CONSTRAINT "RegistreAuditoria_usuariId_fkey" FOREIGN KEY ("usuariId") REFERENCES "Usuari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
