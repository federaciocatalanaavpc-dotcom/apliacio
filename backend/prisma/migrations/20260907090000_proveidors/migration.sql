-- CreateTable
CREATE TABLE "Proveidor" (
    "id" TEXT NOT NULL,
    "agrupacioId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categoria" TEXT,
    "contacte" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "adreca" TEXT,
    "notes" TEXT,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "creatEl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proveidor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Proveidor" ADD CONSTRAINT "Proveidor_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
