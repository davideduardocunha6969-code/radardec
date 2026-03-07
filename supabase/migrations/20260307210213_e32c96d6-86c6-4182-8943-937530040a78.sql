ALTER TABLE public.monitored_profiles ADD COLUMN IF NOT EXISTS engagement_score_30d NUMERIC;
ALTER TABLE public.monitored_profiles ADD COLUMN IF NOT EXISTS engagement_score_all NUMERIC;