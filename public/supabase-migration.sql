-- TrueOddsIQ pick publish workflow
-- Supabase: SQL Editor -> New query -> paste ALL -> Run
-- Safe to re-run. Expected: Success. No rows returned.

-- STEP 1: daily_picks
CREATE TABLE IF NOT EXISTS public.daily_picks (
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

ALTER TABLE public.daily_picks DROP CONSTRAINT IF EXISTS daily_picks_date_key;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS bet TEXT;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS bet_type TEXT;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS odds DOUBLE PRECISION;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS units DOUBLE PRECISION;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS sort_order INTEGER;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS pick_meta JSONB;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS pick_number INTEGER;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS edge_score DOUBLE PRECISION;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.daily_picks ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

UPDATE public.daily_picks
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

CREATE INDEX IF NOT EXISTS idx_daily_picks_date ON public.daily_picks (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_picks_status ON public.daily_picks (date DESC, status);
CREATE INDEX IF NOT EXISTS idx_daily_picks_published
  ON public.daily_picks (date DESC, published_at DESC)
  WHERE status = 'published';

-- STEP 2: pick_notification_events
-- Drop broken partial table from earlier failed runs, then recreate clean.
DROP TABLE IF EXISTS public.pick_notification_events CASCADE;

CREATE TABLE public.pick_notification_events (
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

CREATE INDEX idx_pick_notification_events_pick
  ON public.pick_notification_events (pick_id, created_at DESC);

CREATE INDEX idx_pick_notification_events_type_date
  ON public.pick_notification_events (event_type, created_at DESC);

-- STEP 3: pick_publish_log
DROP TABLE IF EXISTS public.pick_publish_log CASCADE;

CREATE TABLE public.pick_publish_log (
  date DATE PRIMARY KEY,
  free_pick_published BOOLEAN NOT NULL DEFAULT FALSE,
  no_free_pick_notified BOOLEAN NOT NULL DEFAULT FALSE,
  premium_picks_published INTEGER NOT NULL DEFAULT 0,
  last_pipeline_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
