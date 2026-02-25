
-- Tabela de seções para organizar campos do lead
CREATE TABLE public.crm_lead_secoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_lead_secoes ENABLE ROW LEVEL SECURITY;

-- Policies - authenticated users can view, admins can manage
CREATE POLICY "Authenticated users can view secoes"
ON public.crm_lead_secoes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage secoes"
ON public.crm_lead_secoes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar coluna secao_id na tabela crm_lead_campos
ALTER TABLE public.crm_lead_campos
ADD COLUMN secao_id UUID REFERENCES public.crm_lead_secoes(id) ON DELETE SET NULL;
