ALTER TABLE "AssistenciaServei" ADD COLUMN "puntNom" TEXT,
ADD COLUMN "puntLatitud" DOUBLE PRECISION,
ADD COLUMN "puntLongitud" DOUBLE PRECISION,
ADD COLUMN "puntRadi" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "AssistenciaServei" ADD CONSTRAINT "punt_servei_valid" CHECK (
  "puntRadi" BETWEEN 20 AND 2000 AND
  (("puntLatitud" IS NULL AND "puntLongitud" IS NULL) OR
   ("puntLatitud" IS NOT NULL AND "puntLongitud" IS NOT NULL AND "puntLatitud" BETWEEN -90 AND 90 AND "puntLongitud" BETWEEN -180 AND 180))
);
