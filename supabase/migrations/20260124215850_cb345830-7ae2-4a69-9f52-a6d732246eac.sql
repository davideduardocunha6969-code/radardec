-- Create table for origin formats (content source formats)
CREATE TABLE public.formatos_origem (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT 'play',
  cor TEXT NOT NULL DEFAULT 'red',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for output formats (content destination formats)
CREATE TABLE public.formatos_saida (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT 'play',
  cor TEXT NOT NULL DEFAULT 'red',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for both tables
ALTER TABLE public.formatos_origem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formatos_saida ENABLE ROW LEVEL SECURITY;

-- RLS policies for formatos_origem (read for all authenticated, write for admins)
CREATE POLICY "Authenticated users can view formatos_origem"
ON public.formatos_origem
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage formatos_origem"
ON public.formatos_origem
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for formatos_saida (read for all authenticated, write for admins)
CREATE POLICY "Authenticated users can view formatos_saida"
ON public.formatos_saida
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage formatos_saida"
ON public.formatos_saida
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_formatos_origem_updated_at
BEFORE UPDATE ON public.formatos_origem
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formatos_saida_updated_at
BEFORE UPDATE ON public.formatos_saida
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default origin formats
INSERT INTO public.formatos_origem (key, nome, descricao, icone, cor, ordem) VALUES
  ('video', 'Vídeo Curto', 'Reels/Shorts/TikTok', 'play', 'red', 1),
  ('video_longo', 'Vídeo Longo', 'YouTube 5-15min', 'video', 'blue', 2),
  ('carrossel', 'Carrossel', '5-10 slides', 'layout-grid', 'purple', 3),
  ('estatico', 'Post Estático', 'Imagem única', 'image', 'green', 4),
  ('blog_post', 'Blog Post', 'Artigo de blog', 'book-open', 'amber', 5),
  ('publicacao', 'Publicação', 'Post de texto', 'newspaper', 'cyan', 6);

-- Insert default output formats
INSERT INTO public.formatos_saida (key, nome, descricao, icone, cor, ordem) VALUES
  ('video', 'Vídeo Curto', '30-90 segundos', 'play', 'red', 1),
  ('video_longo', 'Vídeo Longo', '5-15 minutos', 'video', 'blue', 2),
  ('carrossel', 'Carrossel', '5-10 slides', 'layout-grid', 'purple', 3),
  ('estatico', 'Estático', 'Imagem única', 'image', 'green', 4);