-- Soft delete column for works
ALTER TABLE "Work"
    ADD COLUMN "deletedAt" TIMESTAMP;
