-- Create table for spreadsheet/tab context descriptions
CREATE TABLE public.ia_data_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('planilha', 'aba')),
  planilha_key TEXT NOT NULL,
  gid TEXT, -- NULL for planilha-level, set for tab-level
  nome TEXT NOT NULL,
  descricao TEXT,
  colunas JSONB DEFAULT '[]'::jsonb, -- Array of {letra, nome, descricao}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(planilha_key, gid)
);

-- Create table for organizational chart
CREATE TABLE public.ia_organograma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  setor TEXT,
  funcao TEXT, -- Detailed description of responsibilities
  subordinado_a UUID REFERENCES public.ia_organograma(id) ON DELETE SET NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ia_data_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_organograma ENABLE ROW LEVEL SECURITY;

-- Policies for ia_data_context (admins manage, all authenticated can view)
CREATE POLICY "Admins can manage ia_data_context" 
ON public.ia_data_context 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view ia_data_context" 
ON public.ia_data_context 
FOR SELECT 
USING (true);

-- Policies for ia_organograma (admins manage, all authenticated can view)
CREATE POLICY "Admins can manage ia_organograma" 
ON public.ia_organograma 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view ia_organograma" 
ON public.ia_organograma 
FOR SELECT 
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_ia_data_context_updated_at
BEFORE UPDATE ON public.ia_data_context
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ia_organograma_updated_at
BEFORE UPDATE ON public.ia_organograma
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();