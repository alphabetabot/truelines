-- Run this in Supabase SQL Editor to create daily_picks table

CREATE TABLE IF NOT EXISTS daily_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  sport TEXT NOT NULL,
  game TEXT,
  pick TEXT NOT NULL,
  bet_type TEXT,
  odds FLOAT,
  confidence TEXT,
  edge TEXT,
  result TEXT,
  units FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, pick)
);

-- Create index for fast lookups
CREATE INDEX idx_daily_picks_date ON daily_picks(date DESC);
CREATE INDEX idx_daily_picks_sport ON daily_picks(sport);

-- Enable RLS
ALTER TABLE daily_picks ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read picks, only authenticated users can write
CREATE POLICY "Anyone can read picks" ON daily_picks
  FOR SELECT USING (true);

-- Run this to verify:
-- SELECT * FROM daily_picks ORDER BY date DESC LIMIT 10;
