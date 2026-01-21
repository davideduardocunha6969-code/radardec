-- Add tipo column to ai_prompts to distinguish between transcription and modelador prompts
ALTER TABLE public.ai_prompts 
ADD COLUMN tipo TEXT NOT NULL DEFAULT 'transcricao';

-- Add check constraint for valid tipos
ALTER TABLE public.ai_prompts 
ADD CONSTRAINT ai_prompts_tipo_check CHECK (tipo IN ('transcricao', 'modelador'));

-- Create index for faster filtering by tipo
CREATE INDEX idx_ai_prompts_tipo ON public.ai_prompts(tipo);