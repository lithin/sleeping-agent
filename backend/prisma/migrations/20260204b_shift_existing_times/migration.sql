-- Shift existing sleep and wake timestamps by -8 hours and write raw strings with -08:00 offset

-- Move stored instants back by 8 hours (convert from UTC to local -08:00)
UPDATE "sleeps"
SET
  "start_time" = "start_time" - INTERVAL '8 hours',
  "end_time"   = CASE WHEN "end_time" IS NULL THEN NULL ELSE "end_time" - INTERVAL '8 hours' END;

UPDATE "sleep_wakes"
SET
  "timestamp" = "timestamp" - INTERVAL '8 hours';

-- Populate raw fields to reflect the new local wall time with explicit -08:00 offset
UPDATE "sleeps"
SET
  "start_time_raw" = to_char(("start_time" AT TIME ZONE '-08'), 'YYYY-MM-DD"T"HH24:MI:SS.MS-08:00'),
  "end_time_raw"   = CASE
    WHEN "end_time" IS NULL THEN NULL
    ELSE to_char(("end_time" AT TIME ZONE '-08'), 'YYYY-MM-DD"T"HH24:MI:SS.MS-08:00')
  END;
