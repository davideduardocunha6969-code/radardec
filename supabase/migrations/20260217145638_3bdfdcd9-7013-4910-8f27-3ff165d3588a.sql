
-- Tabela de chamadas do CRM
CREATE TABLE public.crm_chamadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  twilio_call_sid TEXT,
  numero_discado TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'iniciando',
  duracao_segundos INTEGER,
  recording_url TEXT,
  audio_url TEXT,
  transcricao TEXT,
  resumo_ia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_chamadas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view chamadas" ON public.crm_chamadas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create chamadas" ON public.crm_chamadas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update chamadas" ON public.crm_chamadas
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own chamadas" ON public.crm_chamadas
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_crm_chamadas_updated_at
  BEFORE UPDATE ON public.crm_chamadas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
