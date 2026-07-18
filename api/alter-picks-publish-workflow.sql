-- TrueOddsIQ: pick publish workflow migration
-- Supabase -> SQL Editor -> New query -> paste -> Run
-- Safe to run more than once.

-- 0) Ensure base table exists
CREATE TABLE IF NOT EXISTS daily_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  sport TEXT NOT NULL,
  game TEXT,
  pick TEXT NOT NULL,
  bet TEXT,
  bet_type TEXT,
  odds DOUBLE PRECISION,
  confidence TEXT,
  edge TEXT,
  result TEXT,
  units DOUBLE PRECISION,
  sort_order INTEGER,
  recommendation TEXT,
  pick_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1) Legacy columns (older DBs)
ALTER TABLE daily_picks DROP CONSTRAINT IF EXISTS daily_picks_date_key;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS bet TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS bet_type TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS odds DOUBLE PRECISION;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS units DOUBLE PRECISION;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS sort_order INTEGER;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS pick_meta JSONB;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Publish workflow columns
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS pick_number INTEGER;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS edge_score DOUBLE PRECISION;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- 3) Clear bad defaults from an earlier partial migration
DO $$ BEGIN
  ALTER TABLE daily_picks ALTER COLUMN status DROP DEFAULT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE daily_picks ALTER COLUMN tier DROP DEFAULT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4) Backfill existing rows
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

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_daily_picks_date ON daily_picks (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_picks_status ON daily_picks (date DESC, status);
CREATE INDEX IF NOT EXISTS idx_daily_picks_published
  ON daily_picks (date DESC, published_at DESC)
  WHERE status = 'published';

-- 6) Notification audit log (drop broken FK / RLS from prior runs)
ALTER TABLE IF EXISTS pick_notification_events
  DROP CONSTRAINT IF EXISTS pick_notification_events_pick_id_fkey;

ALTER TABLE IF EXISTS pick_notification_events
  DISABLE ROW LEVEL SECURITY;

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

-- 7) Daily publish state
CREATE TABLE IF NOT EXISTS pick_publish_log (
  date DATE PRIMARY KEY,
  free_pick_published BOOLEAN NOT NULL DEFAULT FALSE,
  no_free_pick_notified BOOLEAN NOT NULL DEFAULT FALSE,
  premium_picks_published INTEGER NOT NULL DEFAULT 0,
  last_pipeline_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pick_publish_log ADD COLUMN IF NOT EXISTS free_pick_published BOOLEAN DEFAULT FALSE;
ALTER TABLE pick_publish_log ADD COLUMN IF NOT EXISTS no_free_pick_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE pick_publish_log ADD COLUMN IF NOT EXISTS premium_picks_published INTEGER DEFAULT 0;
ALTER TABLE pick_publish_log ADD COLUMN IF NOT EXISTS last_pipeline_run_at TIMESTAMPTZ;
ALTER TABLE pick_publish_log ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
