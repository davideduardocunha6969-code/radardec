-- Create table for responsible persons
CREATE TABLE public.atividades_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atividades_responsaveis ENABLE ROW LEVEL SECURITY;

-- RLS policies for responsaveis
CREATE POLICY "Users can view all responsaveis" ON public.atividades_responsaveis FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create responsaveis" ON public.atividades_responsaveis FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete responsaveis" ON public.atividades_responsaveis FOR DELETE USING (auth.uid() IS NOT NULL);

-- Insert default responsible persons
INSERT INTO public.atividades_responsaveis (nome) VALUES 
  ('David'), ('Kadu'), ('Luiza'), ('Letícia'), ('Camila'), ('Lucas');

-- Create table for custom kanban columns
CREATE TABLE public.atividades_colunas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  cor TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atividades_colunas ENABLE ROW LEVEL SECURITY;

-- RLS policies for colunas
CREATE POLICY "Users can view all colunas" ON public.atividades_colunas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage colunas" ON public.atividades_colunas FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert default columns
INSERT INTO public.atividades_colunas (nome, ordem) VALUES 
  ('Pendentes', 0), ('Em Andamento', 1), ('Retificação', 2), ('Finalizado', 3);

-- Create main activities table
CREATE TABLE public.atividades_marketing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  responsavel_id UUID REFERENCES public.atividades_responsaveis(id) ON DELETE SET NULL,
  coluna_id UUID REFERENCES public.atividades_colunas(id) ON DELETE SET NULL,
  atividade TEXT NOT NULL,
  prazo_fatal DATE,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atividades_marketing ENABLE ROW LEVEL SECURITY;

-- RLS policies for atividades
CREATE POLICY "Users can view all atividades" ON public.atividades_marketing FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create atividades" ON public.atividades_marketing FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update atividades" ON public.atividades_marketing FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete atividades" ON public.atividades_marketing FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create comments table
CREATE TABLE public.atividades_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id UUID NOT NULL REFERENCES public.atividades_marketing(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atividades_comentarios ENABLE ROW LEVEL SECURITY;

-- RLS policies for comentarios
CREATE POLICY "Users can view all comentarios" ON public.atividades_comentarios FOR SELECT USING (true);
CREATE POLICY "Users can create comentarios" ON public.atividades_comentarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comentarios" ON public.atividades_comentarios FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('atividades-anexos', 'atividades-anexos', true);

-- Storage policies
CREATE POLICY "Anyone can view atividades anexos" ON storage.objects FOR SELECT USING (bucket_id = 'atividades-anexos');
CREATE POLICY "Authenticated users can upload atividades anexos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'atividades-anexos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete atividades anexos" ON storage.objects FOR DELETE USING (bucket_id = 'atividades-anexos' AND auth.uid() IS NOT NULL);

-- Create attachments table
CREATE TABLE public.atividades_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id UUID NOT NULL REFERENCES public.atividades_marketing(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atividades_anexos ENABLE ROW LEVEL SECURITY;

-- RLS policies for anexos
CREATE POLICY "Users can view all anexos" ON public.atividades_anexos FOR SELECT USING (true);
CREATE POLICY "Users can create anexos" ON public.atividades_anexos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own anexos" ON public.atividades_anexos FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_atividades_marketing_updated_at
BEFORE UPDATE ON public.atividades_marketing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();