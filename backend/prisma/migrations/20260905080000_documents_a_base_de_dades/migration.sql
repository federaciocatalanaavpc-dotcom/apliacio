-- AddColumn
ALTER TABLE "Document" ADD COLUMN "fitxerContingut" BYTEA;
ALTER TABLE "Document" ADD COLUMN "fitxerMimeType" TEXT;

-- Els fitxers antics vivien al disc efímer del servidor i s'han perdut en
-- redeploys successius (el pla gratuït de Render no té disc persistent).
-- Marquem com a pendents els documents que tenien un fitxer però encara no
-- tenen contingut a la base de dades, perquè es puguin tornar a pujar.
UPDATE "Document" SET "pendent" = true WHERE "fitxerUrl" IS NOT NULL AND "fitxerContingut" IS NULL;

-- DropColumn
ALTER TABLE "Document" DROP COLUMN "fitxerUrl";
