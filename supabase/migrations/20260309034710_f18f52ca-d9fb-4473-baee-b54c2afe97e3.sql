
-- Create storage bucket for reels videos
INSERT INTO storage.buckets (id, name, public) VALUES ('reels-videos', 'reels-videos', true);

-- Storage RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload reels videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reels-videos');

CREATE POLICY "Anyone can view reels videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'reels-videos');

CREATE POLICY "Users can delete own reels videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reels-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create reels_projetos table
CREATE TABLE public.reels_projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  hooks_count INTEGER NOT NULL DEFAULT 0,
  ctas_count INTEGER NOT NULL DEFAULT 0,
  variacoes_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reels_projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reels_projetos"
ON public.reels_projetos FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create reels_variacoes table
CREATE TABLE public.reels_variacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.reels_projetos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  render_id TEXT,
  video_url TEXT,
  hook_url TEXT,
  corpo_url TEXT,
  cta_url TEXT,
  erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reels_variacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reels_variacoes"
ON public.reels_variacoes FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
