
-- 1. Add columns to monitored_profiles (avatar_url already exists)
ALTER TABLE public.monitored_profiles
  ADD COLUMN IF NOT EXISTS posts_count INTEGER,
  ADD COLUMN IF NOT EXISTS avg_posts_per_day DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS avg_posts_per_week DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS avg_posts_per_month DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS engagement_score_7d DECIMAL(10,2);

-- 2. Create profile_history table
CREATE TABLE public.profile_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.monitored_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  followers_count INTEGER,
  posts_count INTEGER,
  avg_views_7d DECIMAL(10,2),
  avg_likes_7d DECIMAL(10,2),
  engagement_score DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile_history"
  ON public.profile_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Add columns to viral_content
ALTER TABLE public.viral_content
  ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rank_position INTEGER;
