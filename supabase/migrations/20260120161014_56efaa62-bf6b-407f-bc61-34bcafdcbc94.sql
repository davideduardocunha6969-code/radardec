-- Create table for legal product types
CREATE TABLE public.tipos_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  setor TEXT NOT NULL,
  caracteristicas TEXT,
  perfil_cliente_ideal TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tipos_produtos ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view all product types" 
ON public.tipos_produtos 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create product types" 
ON public.tipos_produtos 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update product types" 
ON public.tipos_produtos 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete product types" 
ON public.tipos_produtos 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tipos_produtos_updated_at
BEFORE UPDATE ON public.tipos_produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for content modeling sessions
CREATE TABLE public.modelagens_conteudo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('video', 'blog_post', 'publicacao')),
  link_original TEXT NOT NULL,
  tipo_produto_id UUID NOT NULL REFERENCES public.tipos_produtos(id) ON DELETE CASCADE,
  gancho_original TEXT,
  analise_estrategia TEXT,
  analise_performance TEXT,
  legenda_original TEXT,
  analise_filmagem TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'analisado', 'enviado')),
  ideia_conteudo_id UUID REFERENCES public.ideias_conteudo(id),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.modelagens_conteudo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own modelagens" 
ON public.modelagens_conteudo 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create modelagens" 
ON public.modelagens_conteudo 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own modelagens" 
ON public.modelagens_conteudo 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own modelagens" 
ON public.modelagens_conteudo 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_modelagens_conteudo_updated_at
BEFORE UPDATE ON public.modelagens_conteudo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();