-- Create cache table for storing computed insights
CREATE TABLE IF NOT EXISTS "cache_entries" (
  "key" TEXT PRIMARY KEY,
  "timestamp" TIMESTAMPTZ(3) NOT NULL,
  "data" TEXT NOT NULL
);
