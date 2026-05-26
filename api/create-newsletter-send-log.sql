-- Run once in Supabase SQL Editor to prevent duplicate daily newsletter emails

CREATE TABLE IF NOT EXISTS newsletter_daily_sends (
  date DATE PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscriber_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_newsletter_daily_sends_sent_at ON newsletter_daily_sends(sent_at DESC);

ALTER TABLE newsletter_daily_sends ENABLE ROW LEVEL SECURITY;
