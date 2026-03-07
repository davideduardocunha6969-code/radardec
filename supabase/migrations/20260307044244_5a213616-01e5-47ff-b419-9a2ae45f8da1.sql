ALTER TABLE profile_history
  ADD COLUMN IF NOT EXISTS avg_engagement_7d numeric,
  ADD COLUMN IF NOT EXISTS avg_engagement_30d numeric,
  ADD COLUMN IF NOT EXISTS avg_views_30d numeric,
  ADD COLUMN IF NOT EXISTS avg_likes_30d numeric,
  ADD COLUMN IF NOT EXISTS posts_count_7d integer,
  ADD COLUMN IF NOT EXISTS posts_count_30d integer;