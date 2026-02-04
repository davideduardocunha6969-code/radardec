-- Drop old constraint and add new one with 'replica' included
ALTER TABLE public.ai_prompts DROP CONSTRAINT ai_prompts_tipo_check;

ALTER TABLE public.ai_prompts ADD CONSTRAINT ai_prompts_tipo_check 
  CHECK (tipo = ANY (ARRAY['transcricao'::text, 'modelador'::text, 'replica'::text]));