-- Add isHidden flag on Artist to allow hiding authors from the public site
ALTER TABLE "Artist"
    ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT FALSE;
