
CREATE TABLE public.zapsign_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  user_id uuid NOT NULL,
  doc_token text,
  signer_token text,
  sign_url text,
  template_id text,
  template_nome text,
  nome_documento text,
  status text NOT NULL DEFAULT 'pendente',
  dados_enviados jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.zapsign_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own zapsign docs"
  ON public.zapsign_documentos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own zapsign docs"
  ON public.zapsign_documentos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
