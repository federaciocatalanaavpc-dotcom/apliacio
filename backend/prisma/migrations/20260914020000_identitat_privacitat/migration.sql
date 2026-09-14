ALTER TABLE "Usuari" ADD COLUMN "privacitatVersio" TEXT;
ALTER TABLE "Usuari" ADD COLUMN "privacitatLlegidaEl" TIMESTAMP(3);
CREATE TABLE "LogoAgrupacio" (
 "agrupacioId" TEXT PRIMARY KEY, "contingut" BYTEA NOT NULL, "actualitzatEl" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "LogoAgrupacio_agrupacioId_fkey" FOREIGN KEY ("agrupacioId") REFERENCES "Agrupacio"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
