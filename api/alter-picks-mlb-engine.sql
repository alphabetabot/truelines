-- MLB engine tracking fields for daily_picks
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS recommendation TEXT;
ALTER TABLE daily_picks ADD COLUMN IF NOT EXISTS pick_meta JSONB;

CREATE INDEX IF NOT EXISTS idx_daily_picks_recommendation ON daily_picks(recommendation);
