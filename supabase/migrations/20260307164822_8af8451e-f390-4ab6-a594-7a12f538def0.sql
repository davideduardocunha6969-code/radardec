ALTER TABLE monitored_profiles
  ADD COLUMN IF NOT EXISTS avg_shares_recent NUMERIC,
  ADD COLUMN IF NOT EXISTS avg_saves_recent NUMERIC,
  ADD COLUMN IF NOT EXISTS best_post_engagement NUMERIC,
  ADD COLUMN IF NOT EXISTS total_posts_7d INTEGER;