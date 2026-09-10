ALTER TABLE "Usuari"
 ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "passwordMustChange" BOOLEAN NOT NULL DEFAULT true,
 ADD COLUMN "mfaSecret" TEXT,
 ADD COLUMN "mfaPendingSecret" TEXT,
 ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "mfaLastStep" INTEGER NOT NULL DEFAULT -1,
 ADD COLUMN "mfaRecovery" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 ADD COLUMN "accessTokenHash" TEXT,
 ADD COLUMN "accessExpires" TIMESTAMP(3),
 ADD COLUMN "authFailed" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "authLockedUntil" TIMESTAMP(3);
CREATE UNIQUE INDEX "Usuari_accessTokenHash_key" ON "Usuari"("accessTokenHash");
