
-- Table for SDR scripts with structured checklist items
CREATE TABLE public.scripts_sdr (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  qualificacao JSONB NOT NULL DEFAULT '[]'::jsonb,
  reca JSONB NOT NULL DEFAULT '[]'::jsonb,
  raloca JSONB NOT NULL DEFAULT '[]'::jsonb,
  instrucoes_gerais TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scripts_sdr ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view scripts" ON public.scripts_sdr
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create scripts" ON public.scripts_sdr
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update scripts" ON public.scripts_sdr
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete scripts" ON public.scripts_sdr
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
