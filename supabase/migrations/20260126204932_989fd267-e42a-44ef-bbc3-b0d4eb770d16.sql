-- Create table for office information
CREATE TABLE public.ia_escritorio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sobre TEXT,
  areas_atuacao TEXT,
  diferenciais TEXT,
  metas_ano TEXT,
  valores TEXT,
  historico TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ia_escritorio ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view ia_escritorio"
ON public.ia_escritorio
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage ia_escritorio"
ON public.ia_escritorio
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ia_escritorio_updated_at
BEFORE UPDATE ON public.ia_escritorio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial empty row
INSERT INTO public.ia_escritorio (sobre, areas_atuacao, diferenciais, metas_ano, valores, historico)
VALUES ('', '', '', '', '', '');