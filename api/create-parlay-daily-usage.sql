-- Run once in Supabase SQL Editor — tracks free-tier AI parlay builds per user per Pacific day

CREATE TABLE IF NOT EXISTS parlay_daily_usage (
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  build_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_parlay_daily_usage_date ON parlay_daily_usage(date DESC);

ALTER TABLE parlay_daily_usage ENABLE ROW LEVEL SECURITY;
