-- Store raw newsletter pick text so pick order can be repaired without re-sending email.
ALTER TABLE newsletter_daily_sends ADD COLUMN IF NOT EXISTS picks_text TEXT;
