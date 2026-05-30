-- One-time correction for mis-graded daily_picks (wrong game in series / cron never updated DB).
-- Run in Supabase SQL Editor, then hard-refresh the site tracker.
-- Generated from corrected grading logic on 2026-05-30.

-- "Mixed" was never a result type — it meant sport was unknown at save time. All current rows are MLB.
UPDATE daily_picks SET sport = 'MLB' WHERE sport = 'Mixed';

UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = '03c39c87-21f5-49d7-99cc-0e7e0bfb59df'; -- 2026-05-29 Miami Marlins ML (was W)
UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = '47392be0-11ae-4b14-995d-963bc166e252'; -- 2026-05-28 Minnesota Twins ML (was W)
UPDATE daily_picks SET result = 'W', units = 1.3600 WHERE id = '0202f68e-d4e0-4966-9f56-58611afae7f3'; -- 2026-05-28 Atlanta Braves -1.5 (was L)
UPDATE daily_picks SET result = 'W', units = 0.8403 WHERE id = 'c3b86519-5aa5-46dc-a9ec-53508c1854d8'; -- 2026-05-26 Yankees -1.5 (was L)
UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = 'c7acd43b-c72d-4aff-b072-be7a8945490a'; -- 2026-05-25 Tampa Bay Rays ML (was W)
UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = 'cc981577-3a6d-4919-9f05-220e5dcf656d'; -- 2026-05-24 Seattle Mariners @ Kansas City Royals (was W)
UPDATE daily_picks SET result = 'W', units = 0.6135 WHERE id = '0783ef80-00f2-47a6-82d1-fdfa53809a5a'; -- 2026-05-24 Los Angeles Dodgers @ Milwaukee Brewers (was L)
UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = '30ff6944-b96b-496f-8565-e0508ffc2f33'; -- 2026-05-24 Atlanta Braves @ Washington Nationals (was W)
UPDATE daily_picks SET result = 'W', units = 1.0000 WHERE id = 'ad33e30f-45df-4111-b1c8-0d270bbad52e'; -- 2026-05-24 FADE: Tampa Bay Rays @ New York Yankees (was L)
UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = 'c82b3351-7251-42b5-9d08-faee2b2ea15a'; -- 2026-05-23 Seattle Mariners @ Kansas City Royals (was W)
UPDATE daily_picks SET result = 'W', units = 0.8197 WHERE id = 'c63670a5-4518-4ae2-a364-e457afefd2c6'; -- 2026-05-23 Los Angeles Dodgers @ Milwaukee Brewers (was L)
UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = '72ce5e97-2296-4e88-bdb3-c210b2db74ed'; -- 2026-05-23 Atlanta Braves @ Washington Nationals (was W)
UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = '5faa0d1b-737c-4cba-8fb8-4b3ccba797f4'; -- 2026-05-12 Dodgers ML (was W)
UPDATE daily_picks SET result = 'W', units = 1.0000 WHERE id = '9c7f912b-c47a-4586-91c3-5638e398c881'; -- 2026-05-10 Under 8.5 (was L)
UPDATE daily_picks SET result = 'L', units = -1.0000 WHERE id = '0093c1f8-46e7-4a2a-9bbe-3ac8a5d1b1fc'; -- 2026-05-09 Mets ML (was W)
