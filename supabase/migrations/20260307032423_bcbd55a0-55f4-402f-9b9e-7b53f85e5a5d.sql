ALTER TABLE monitored_profiles
  ADD COLUMN IF NOT EXISTS is_own_account boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS following_count integer,
  ADD COLUMN IF NOT EXISTS biography text,
  ADD COLUMN IF NOT EXISTS is_business boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS date_joined text,
  ADD COLUMN IF NOT EXISTS avg_likes_recent numeric,
  ADD COLUMN IF NOT EXISTS avg_views_recent numeric,
  ADD COLUMN IF NOT EXISTS avg_comments_recent numeric,
  ADD COLUMN IF NOT EXISTS avg_shares_recent numeric,
  ADD COLUMN IF NOT EXISTS engagement_rate numeric,
  ADD COLUMN IF NOT EXISTS top_posts jsonb;