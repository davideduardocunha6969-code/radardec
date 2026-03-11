
CREATE TABLE public.zapsign_template_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT NOT NULL,
  campo_key TEXT NOT NULL,
  variavel_zapsign TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, campo_key)
);

ALTER TABLE public.zapsign_template_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mappings"
  ON public.zapsign_template_mappings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
