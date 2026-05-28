-- Run if you already created newsletter_daily_sends from the first migration

ALTER TABLE newsletter_daily_sends
  ALTER COLUMN sent_at DROP NOT NULL;

ALTER TABLE newsletter_daily_sends
  ADD COLUMN IF NOT EXISTS cron_schedule TEXT;

ALTER TABLE newsletter_daily_sends
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
