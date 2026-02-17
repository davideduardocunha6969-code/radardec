
-- Add robo_feedback_id column to crm_colunas for linking feedback coaches per column
ALTER TABLE public.crm_colunas ADD COLUMN robo_feedback_id uuid REFERENCES public.robos_coach(id) ON DELETE SET NULL;
