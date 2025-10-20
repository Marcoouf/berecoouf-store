CREATE TABLE IF NOT EXISTS "public"."Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "handle" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."Work" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER,
    "technique" TEXT,
    "paper" TEXT,
    "dimensions" TEXT,
    "edition" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mockupUrl" TEXT,
    "basePrice" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "artistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."Variant" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Artist_slug_key" ON "public"."Artist"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Work_slug_key" ON "public"."Work"("slug");
CREATE INDEX IF NOT EXISTS "Work_artistId_idx" ON "public"."Work"("artistId");
CREATE INDEX IF NOT EXISTS "Variant_workId_idx" ON "public"."Variant"("workId");

DO $$
BEGIN
    ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    ALTER TABLE "public"."Variant" ADD CONSTRAINT "Variant_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;
