ALTER TABLE "sleeps"
  ADD COLUMN IF NOT EXISTS "start_time_raw" TEXT,
  ADD COLUMN IF NOT EXISTS "end_time_raw" TEXT;
