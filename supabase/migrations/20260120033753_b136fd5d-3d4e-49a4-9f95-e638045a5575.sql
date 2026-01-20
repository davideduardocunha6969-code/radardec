-- Criar tabela de transcrições
CREATE TABLE public.transcricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  duracao_segundos INTEGER,
  texto_completo TEXT,
  segmentos JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transcricoes ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver suas próprias transcrições
CREATE POLICY "Users can view their own transcricoes"
ON public.transcricoes
FOR SELECT
USING (auth.uid() = user_id);

-- Política: usuários podem criar suas próprias transcrições
CREATE POLICY "Users can create their own transcricoes"
ON public.transcricoes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar suas próprias transcrições
CREATE POLICY "Users can update their own transcricoes"
ON public.transcricoes
FOR UPDATE
USING (auth.uid() = user_id);

-- Política: usuários podem deletar suas próprias transcrições
CREATE POLICY "Users can delete their own transcricoes"
ON public.transcricoes
FOR DELETE
USING (auth.uid() = user_id);

-- Política: admins podem ver todas as transcrições
CREATE POLICY "Admins can view all transcricoes"
ON public.transcricoes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_transcricoes_updated_at
BEFORE UPDATE ON public.transcricoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para armazenar áudios extraídos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('audiencias', 'audiencias', false, 52428800);

-- Política: usuários podem fazer upload de seus próprios arquivos
CREATE POLICY "Users can upload their own audio files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'audiencias' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: usuários podem ver seus próprios arquivos
CREATE POLICY "Users can view their own audio files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'audiencias' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: usuários podem deletar seus próprios arquivos
CREATE POLICY "Users can delete their own audio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'audiencias' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);