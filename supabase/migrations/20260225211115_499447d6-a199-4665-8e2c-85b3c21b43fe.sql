
ALTER TABLE public.crm_chamadas
ADD COLUMN papel text NOT NULL DEFAULT 'sdr';

ALTER TABLE public.robos_coach
ADD COLUMN instrucoes_resumo text DEFAULT '';
