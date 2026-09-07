-- CreateEnum
CREATE TYPE "TipusEquipament" AS ENUM ('ROBA', 'EPI');

-- CreateTable
CREATE TABLE "ArticleEquipament" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "tipus" "TipusEquipament" NOT NULL,
    "nom" TEXT NOT NULL,
    "talla" TEXT,
    "estocTotal" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleEquipament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignacioEquipament" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "voluntariId" TEXT NOT NULL,
    "quantitat" INTEGER NOT NULL DEFAULT 1,
    "dataAssignacio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataRetorn" TIMESTAMP(3),
    "notes" TEXT,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignacioEquipament_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArticleEquipament" ADD CONSTRAINT "ArticleEquipament_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignacioEquipament" ADD CONSTRAINT "AssignacioEquipament_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ArticleEquipament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignacioEquipament" ADD CONSTRAINT "AssignacioEquipament_voluntariId_fkey" FOREIGN KEY ("voluntariId") REFERENCES "Voluntari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
