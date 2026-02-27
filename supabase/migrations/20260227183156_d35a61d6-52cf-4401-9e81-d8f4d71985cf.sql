ALTER TABLE public.robos_coach
  ADD COLUMN IF NOT EXISTS instrucoes_extrator text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS instrucoes_lacunas text NOT NULL DEFAULT '';