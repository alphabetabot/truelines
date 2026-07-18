-- Pick publish workflow (idempotent — safe to run more than once)
-- Supabase: SQL Editor → New query → paste → Run

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Columns on daily_picks
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS pick_number INTEGER;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS edge_score DOUBLE PRECISION;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- 2) Backfill existing rows so the site keeps working
UPDATE daily_picks
SET
  status = 'published',
  tier = CASE
    WHEN COALESCE(sort_order, 0) = 0 THEN 'free'
    ELSE 'premium'
  END,
  published_at = COALESCE(published_at, created_at, NOW())
WHERE published_at IS NULL
   OR status IS NULL
   OR status IN ('draft', 'approved');

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_daily_picks_status
  ON daily_picks (date DESC, status);

CREATE INDEX IF NOT EXISTS idx_daily_picks_published
  ON daily_picks (date DESC, published_at DESC)
  WHERE status = 'published';

-- 4) Notification audit log (no FK — avoids constraint errors on older DBs)
ALTER TABLE IF EXISTS pick_notification_events
  DROP CONSTRAINT IF EXISTS pick_notification_events_pick_id_fkey;

CREATE TABLE IF NOT EXISTS pick_notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_id UUID,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  audience TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pick_notification_events_pick
  ON pick_notification_events (pick_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pick_notification_events_type_date
  ON pick_notification_events (event_type, created_at DESC);

-- 5) Daily publish state
CREATE TABLE IF NOT EXISTS pick_publish_log (
  date DATE PRIMARY KEY,
  free_pick_published BOOLEAN NOT NULL DEFAULT FALSE,
  no_free_pick_notified BOOLEAN NOT NULL DEFAULT FALSE,
  premium_picks_published INTEGER NOT NULL DEFAULT 0,
  last_pipeline_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
