
-- Add specialized instruction fields to robos_coach
ALTER TABLE public.robos_coach 
  ADD COLUMN instrucoes_reca text NOT NULL DEFAULT '',
  ADD COLUMN instrucoes_raloca text NOT NULL DEFAULT '',
  ADD COLUMN instrucoes_radoveca text NOT NULL DEFAULT '';

-- Migrate existing instrucoes to instrucoes_reca (as requested by user)
UPDATE public.robos_coach SET instrucoes_reca = instrucoes WHERE instrucoes IS NOT NULL AND instrucoes != '';
