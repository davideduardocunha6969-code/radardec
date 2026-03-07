ALTER TABLE monitored_profiles 
ADD COLUMN IF NOT EXISTS legal_area TEXT,
ADD COLUMN IF NOT EXISTS facebook_page_id TEXT,
ADD COLUMN IF NOT EXISTS instagram_business_id TEXT,
ADD COLUMN IF NOT EXISTS meta_page_access_token TEXT;