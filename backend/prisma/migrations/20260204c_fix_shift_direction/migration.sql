-- Reverse prior -8h shift and restore correct UTC/PST pairing
-- Desired: start_time/end_time in UTC (true instant), raw fields show local PST wall time (-08:00) for that instant.

-- First, move stored instants forward by 8 hours to undo the previous backward shift
UPDATE "sleeps"
SET
  "start_time" = "start_time" + INTERVAL '8 hours',
  "end_time"   = CASE WHEN "end_time" IS NULL THEN NULL ELSE "end_time" + INTERVAL '8 hours' END;

UPDATE "sleep_wakes"
SET
  "timestamp" = "timestamp" + INTERVAL '8 hours';

-- Recompute raw fields to reflect PST wall time for the corrected instants
UPDATE "sleeps"
SET
  "start_time_raw" = to_char(("start_time" AT TIME ZONE '-08'), 'YYYY-MM-DD"T"HH24:MI:SS.MS-08:00'),
  "end_time_raw"   = CASE
    WHEN "end_time" IS NULL THEN NULL
    ELSE to_char(("end_time" AT TIME ZONE '-08'), 'YYYY-MM-DD"T"HH24:MI:SS.MS-08:00')
  END;
