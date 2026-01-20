-- Create ideias_conteudo table for Content Hub
CREATE TABLE public.ideias_conteudo (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    setor TEXT NOT NULL,
    formato TEXT NOT NULL,
    titulo TEXT NOT NULL,
    gancho TEXT,
    orientacoes_filmagem TEXT,
    copy_completa TEXT,
    link_inspiracao TEXT,
    link_video_drive TEXT,
    semana_publicacao INTEGER,
    validado BOOLEAN NOT NULL DEFAULT false,
    validado_por UUID,
    validado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ideias_conteudo ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all ideias" 
ON public.ideias_conteudo 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create ideias" 
ON public.ideias_conteudo 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update ideias" 
ON public.ideias_conteudo 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete ideias" 
ON public.ideias_conteudo 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ideias_conteudo_updated_at
BEFORE UPDATE ON public.ideias_conteudo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();