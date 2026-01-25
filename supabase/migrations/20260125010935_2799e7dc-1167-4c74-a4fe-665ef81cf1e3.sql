-- Create table for closer appointments/calls
CREATE TABLE public.atendimentos_closers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_atendimento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    duracao_segundos INTEGER,
    audio_url TEXT,
    transcricao_texto TEXT,
    segmentos JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pendente',
    erro_mensagem TEXT,
    dados_cliente JSONB DEFAULT '{}'::jsonb,
    dados_atendimento JSONB DEFAULT '{}'::jsonb,
    analises_ia JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.atendimentos_closers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own atendimentos"
ON public.atendimentos_closers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all atendimentos"
ON public.atendimentos_closers
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own atendimentos"
ON public.atendimentos_closers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own atendimentos"
ON public.atendimentos_closers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own atendimentos"
ON public.atendimentos_closers
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_atendimentos_closers_updated_at
BEFORE UPDATE ON public.atendimentos_closers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('atendimentos-audio', 'atendimentos-audio', false);

-- Storage policies
CREATE POLICY "Users can upload their own audio"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'atendimentos-audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own audio"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'atendimentos-audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all audio"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'atendimentos-audio' 
    AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete their own audio"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'atendimentos-audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);