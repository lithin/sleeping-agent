-- Convert all datetime columns to TIMESTAMPTZ(3) so local timezone offsets are preserved
ALTER TABLE "feeds"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "sleeps"
  ALTER COLUMN "start_time" TYPE TIMESTAMPTZ(3) USING "start_time" AT TIME ZONE 'UTC',
  ALTER COLUMN "end_time" TYPE TIMESTAMPTZ(3) USING "end_time" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "sleep_wakes"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "babies"
  ALTER COLUMN "date_of_birth" TYPE TIMESTAMPTZ(3) USING "date_of_birth" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
