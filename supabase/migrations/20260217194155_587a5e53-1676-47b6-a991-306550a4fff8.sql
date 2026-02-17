
-- Add feedback columns to crm_chamadas
ALTER TABLE public.crm_chamadas
  ADD COLUMN IF NOT EXISTS feedback_ia text,
  ADD COLUMN IF NOT EXISTS nota_ia integer;

-- Add tipo column to robos_coach to distinguish coaching types
ALTER TABLE public.robos_coach
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'coaching';
