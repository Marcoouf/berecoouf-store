ALTER TABLE "public"."Artist"
    ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "socials" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "Artist_isArchived_deletedAt_idx" ON "public"."Artist"("isArchived", "deletedAt");
