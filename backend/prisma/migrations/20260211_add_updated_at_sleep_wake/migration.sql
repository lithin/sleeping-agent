ALTER TABLE "sleeps"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now();

UPDATE "sleeps"
SET "updated_at" = "created_at"
WHERE "updated_at" IS NULL;

ALTER TABLE "sleep_wakes"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now();

UPDATE "sleep_wakes"
SET "updated_at" = "created_at"
WHERE "updated_at" IS NULL;
