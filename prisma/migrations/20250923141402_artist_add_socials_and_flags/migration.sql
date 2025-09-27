-- AlterTable
ALTER TABLE "public"."Artist" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socials" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Artist_isArchived_deletedAt_idx" ON "public"."Artist"("isArchived", "deletedAt");
