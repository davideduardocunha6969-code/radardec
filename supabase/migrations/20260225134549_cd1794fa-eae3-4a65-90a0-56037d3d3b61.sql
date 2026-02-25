ALTER TABLE public.crm_funis
  ADD COLUMN script_sdr_id uuid REFERENCES scripts_sdr(id) ON DELETE SET NULL,
  ADD COLUMN robo_coach_sdr_id uuid REFERENCES robos_coach(id) ON DELETE SET NULL,
  ADD COLUMN robo_feedback_sdr_id uuid REFERENCES robos_coach(id) ON DELETE SET NULL,
  ADD COLUMN script_closer_id uuid REFERENCES scripts_sdr(id) ON DELETE SET NULL,
  ADD COLUMN robo_coach_closer_id uuid REFERENCES robos_coach(id) ON DELETE SET NULL,
  ADD COLUMN robo_feedback_closer_id uuid REFERENCES robos_coach(id) ON DELETE SET NULL;