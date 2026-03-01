
-- 1.1 Tabela twilio_numeros
CREATE TABLE public.twilio_numeros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  ddd text NOT NULL,
  regiao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.twilio_numeros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage twilio_numeros"
  ON public.twilio_numeros FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view twilio_numeros"
  ON public.twilio_numeros FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 1.2 Tabela power_dialer_sessions
CREATE TABLE public.power_dialer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  funil_id uuid NOT NULL,
  coluna_id uuid NOT NULL,
  papel text NOT NULL DEFAULT 'sdr',
  status text NOT NULL DEFAULT 'ativo',
  numeros_fila jsonb NOT NULL DEFAULT '[]'::jsonb,
  lote_atual integer NOT NULL DEFAULT 0,
  call_sids jsonb NOT NULL DEFAULT '{}'::jsonb,
  lead_atendido_id uuid,
  telefone_atendido text,
  resultado_por_numero jsonb NOT NULL DEFAULT '{}'::jsonb,
  leads_info jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.power_dialer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions"
  ON public.power_dialer_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_pds_user_status ON public.power_dialer_sessions(user_id, status);
CREATE INDEX idx_pds_updated_at ON public.power_dialer_sessions(updated_at DESC);

CREATE TRIGGER update_pds_updated_at
  BEFORE UPDATE ON public.power_dialer_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.power_dialer_sessions;

-- 1.3 Novas colunas em crm_chamadas
ALTER TABLE public.crm_chamadas
  ADD COLUMN power_dialer_session_id uuid REFERENCES public.power_dialer_sessions(id),
  ADD COLUMN caller_id_usado text,
  ADD COLUMN coluna_id_no_momento uuid,
  ADD COLUMN tentativa_numero integer NOT NULL DEFAULT 1,
  ADD COLUMN ddd_destino text,
  ADD COLUMN ddd_caller text,
  ADD COLUMN observacoes text;

CREATE INDEX idx_crm_chamadas_call_sid
  ON public.crm_chamadas(twilio_call_sid)
  WHERE twilio_call_sid IS NOT NULL;

-- 1.4 Função de limpeza
CREATE OR REPLACE FUNCTION public.expire_old_dialer_sessions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE power_dialer_sessions
  SET status = 'expirado'
  WHERE status = 'ativo'
    AND created_at < now() - interval '24 hours';

  UPDATE crm_chamadas
  SET status = 'falhou',
      observacoes = 'Timeout - callback Twilio nao recebido'
  WHERE status = 'em_andamento'
    AND created_at < now() - interval '1 hour';
END;
$$;
