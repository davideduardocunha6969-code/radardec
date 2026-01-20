-- Add prioridade column to atividades_marketing
ALTER TABLE public.atividades_marketing 
ADD COLUMN IF NOT EXISTS prioridade TEXT NOT NULL DEFAULT 'util';

-- First, set all responsavel_id to NULL to avoid FK constraint issues
UPDATE public.atividades_marketing SET responsavel_id = NULL;

-- Drop the foreign key to atividades_responsaveis
ALTER TABLE public.atividades_marketing 
DROP CONSTRAINT IF EXISTS atividades_marketing_responsavel_id_fkey;

-- Change responsavel_id to reference profiles table
ALTER TABLE public.atividades_marketing 
ADD CONSTRAINT atividades_marketing_responsavel_id_fkey 
FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop the atividades_responsaveis table since we'll use profiles
DROP TABLE IF EXISTS public.atividades_responsaveis;