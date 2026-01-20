-- Create table for social media content
CREATE TABLE public.conteudos_midia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  setor TEXT NOT NULL CHECK (setor IN ('trabalhista', 'previdenciario', 'civel', 'bancario')),
  formato TEXT NOT NULL CHECK (formato IN ('video', 'video_longo', 'carrossel', 'estatico')),
  titulo TEXT NOT NULL,
  gancho TEXT,
  orientacoes_filmagem TEXT,
  copy_completa TEXT,
  link_inspiracao TEXT,
  status TEXT NOT NULL DEFAULT 'a_gravar' CHECK (status IN ('a_gravar', 'gravado', 'em_edicao', 'editado', 'postado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conteudos_midia ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all conteudos"
ON public.conteudos_midia
FOR SELECT
USING (true);

CREATE POLICY "Users can create conteudos"
ON public.conteudos_midia
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update conteudos"
ON public.conteudos_midia
FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete conteudos"
ON public.conteudos_midia
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conteudos_midia_updated_at
BEFORE UPDATE ON public.conteudos_midia
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();