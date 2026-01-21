-- Create storage bucket for product attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tipos-produtos-anexos', 'tipos-produtos-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product attachments
CREATE POLICY "Users can view all product attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'tipos-produtos-anexos');

CREATE POLICY "Authenticated users can upload product attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tipos-produtos-anexos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'tipos-produtos-anexos' AND auth.uid() IS NOT NULL);

-- Create table for product attachments
CREATE TABLE public.tipos_produtos_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_produto_id UUID NOT NULL REFERENCES public.tipos_produtos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tipos_produtos_anexos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all product attachments"
ON public.tipos_produtos_anexos FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create attachments"
ON public.tipos_produtos_anexos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete attachments"
ON public.tipos_produtos_anexos FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_tipos_produtos_anexos_produto ON public.tipos_produtos_anexos(tipo_produto_id);