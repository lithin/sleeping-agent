ALTER TABLE "feeds"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now();

UPDATE "feeds"
SET "updated_at" = "created_at"
WHERE "updated_at" IS NULL;

ALTER TABLE "cache_entries"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now();

UPDATE "cache_entries"
SET "updated_at" = "timestamp"
WHERE "updated_at" IS NULL;
