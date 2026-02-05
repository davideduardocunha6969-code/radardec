-- Add foreign key from sugestoes_contratacao.user_id to profiles.user_id
ALTER TABLE public.sugestoes_contratacao
ADD CONSTRAINT sugestoes_contratacao_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add a separate FK for joining with profiles (using user_id)
-- We need to reference profiles by user_id, not id
-- Since profiles.user_id is unique, we can create a proper join path
-- First, let's ensure we have the right index
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);