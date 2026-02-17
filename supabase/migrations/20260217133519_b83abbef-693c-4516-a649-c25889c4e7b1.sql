
-- Tabela de funis
CREATE TABLE public.crm_funis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  area_atuacao text NOT NULL,
  tipo_acao text,
  descricao text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_funis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all funis" ON public.crm_funis FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create funis" ON public.crm_funis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update funis" ON public.crm_funis FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete funis" ON public.crm_funis FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_crm_funis_updated_at BEFORE UPDATE ON public.crm_funis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de colunas do kanban
CREATE TABLE public.crm_colunas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funil_id uuid NOT NULL REFERENCES public.crm_funis(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cor text DEFAULT '#6366f1',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_colunas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view colunas" ON public.crm_colunas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage colunas" ON public.crm_colunas FOR ALL USING (auth.uid() IS NOT NULL);

-- Tabela de leads
CREATE TABLE public.crm_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funil_id uuid NOT NULL REFERENCES public.crm_funis(id) ON DELETE CASCADE,
  coluna_id uuid NOT NULL REFERENCES public.crm_colunas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  endereco text,
  telefones jsonb NOT NULL DEFAULT '[]'::jsonb,
  resumo_caso text,
  dados_extras jsonb DEFAULT '{}'::jsonb,
  ordem integer NOT NULL DEFAULT 0,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads" ON public.crm_leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create leads" ON public.crm_leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update leads" ON public.crm_leads FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete leads" ON public.crm_leads FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_crm_leads_funil ON public.crm_leads(funil_id);
CREATE INDEX idx_crm_leads_coluna ON public.crm_leads(coluna_id);
CREATE INDEX idx_crm_colunas_funil ON public.crm_colunas(funil_id);
