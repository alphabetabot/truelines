-- Run this in Supabase SQL Editor to create daily_picks table

CREATE TABLE IF NOT EXISTS daily_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  sport TEXT NOT NULL,
  game TEXT,
  pick TEXT NOT NULL,
  bet TEXT,
  bet_type TEXT,
  odds FLOAT,
  confidence TEXT,
  edge TEXT,
  result TEXT,
  units FLOAT,
  sort_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, pick)
);

-- Add columns if table already exists without them
ALTER TABLE daily_picks DROP CONSTRAINT IF EXISTS daily_picks_date_key;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS bet TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS bet_type TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS odds FLOAT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS units FLOAT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS sort_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_daily_picks_date ON daily_picks(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_picks_sport ON daily_picks(sport);
CREATE INDEX IF NOT EXISTS idx_daily_picks_pending ON daily_picks(date DESC) WHERE result IS NULL;

ALTER TABLE daily_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read picks" ON daily_picks
  FOR SELECT USING (true);
