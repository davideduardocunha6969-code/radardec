-- Add columns for origin and output format to ai_prompts table
ALTER TABLE public.ai_prompts 
ADD COLUMN IF NOT EXISTS formato_origem text,
ADD COLUMN IF NOT EXISTS formato_saida text;

-- Create index for faster lookups by combination
CREATE INDEX IF NOT EXISTS idx_ai_prompts_formato_combo 
ON public.ai_prompts (tipo, formato_origem, formato_saida);

-- Add comment for documentation
COMMENT ON COLUMN public.ai_prompts.formato_origem IS 'Formato do conteúdo original (video, video_longo, carrossel, estatico, blog_post, publicacao)';
COMMENT ON COLUMN public.ai_prompts.formato_saida IS 'Formato do conteúdo de saída (video, video_longo, carrossel, estatico)';