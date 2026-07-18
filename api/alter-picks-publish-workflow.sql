-- Pick publish workflow: lifecycle states, tiers, notification audit.
-- Run in Supabase SQL Editor after create-picks-table.sql

ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS pick_number INTEGER;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS edge_score FLOAT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_daily_picks_published
  ON daily_picks (date DESC, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_daily_picks_status
  ON daily_picks (date DESC, status);

-- Backfill: existing rows treated as published so the site keeps working.
UPDATE daily_picks
SET
  status = COALESCE(status, 'published'),
  tier = COALESCE(tier, CASE WHEN sort_order = 0 THEN 'free' ELSE 'premium' END),
  published_at = COALESCE(published_at, created_at)
WHERE status IS NULL OR status = 'draft' AND created_at < NOW();

CREATE TABLE IF NOT EXISTS pick_notification_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pick_id UUID REFERENCES daily_picks(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  audience TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pick_notification_events_pick
  ON pick_notification_events (pick_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pick_notification_events_type_date
  ON pick_notification_events (event_type, created_at DESC);

ALTER TABLE pick_notification_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS pick_publish_log (
  date DATE PRIMARY KEY,
  free_pick_published BOOLEAN DEFAULT FALSE,
  no_free_pick_notified BOOLEAN DEFAULT FALSE,
  premium_picks_published INTEGER DEFAULT 0,
  last_pipeline_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
