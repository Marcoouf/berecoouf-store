-- Add vacation flag for artists to disable orders when away
ALTER TABLE "Artist"
  ADD COLUMN IF NOT EXISTS "isOnVacation" BOOLEAN NOT NULL DEFAULT FALSE;
