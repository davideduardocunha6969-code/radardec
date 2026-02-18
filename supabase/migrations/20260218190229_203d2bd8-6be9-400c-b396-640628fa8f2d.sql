
-- Add script SDR and closer-specific robot columns to crm_colunas
ALTER TABLE public.crm_colunas
  ADD COLUMN script_sdr_id uuid REFERENCES public.scripts_sdr(id) ON DELETE SET NULL,
  ADD COLUMN robo_coach_closer_id uuid REFERENCES public.robos_coach(id) ON DELETE SET NULL,
  ADD COLUMN robo_feedback_closer_id uuid REFERENCES public.robos_coach(id) ON DELETE SET NULL,
  ADD COLUMN script_closer_id uuid REFERENCES public.scripts_sdr(id) ON DELETE SET NULL;
