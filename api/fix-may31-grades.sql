-- One-time fix: May 31, 2026 picks were graded using May 30 scores (series / early cron).
-- Run in Supabase SQL Editor, then hard-refresh the tracker.
-- After deploy, log-results will prevent recurrence; optional: curl /api/log-results with CRON_SECRET.

UPDATE daily_picks SET result = 'L', units = -1.0000
WHERE id = '862b0c4b-ba74-4cb1-8f84-0186b7361bc6'; -- Atlanta Braves ML (was W)

UPDATE daily_picks SET result = 'W', units = 0.5076
WHERE id = '80d87299-dc72-4d4e-8721-bdac9c26fb13'; -- Milwaukee Brewers ML (was L)

UPDATE daily_picks SET result = 'W', units = 0.4717
WHERE id = '3d872c53-02b4-4ac6-bd7e-810b1755b4ce'; -- Los Angeles Dodgers ML (was L)
