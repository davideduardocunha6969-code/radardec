
CREATE TABLE public.plano_comercial_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES public.plano_comercial_nodes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  texto text NOT NULL,
  concluido boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plano_comercial_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checklist items"
  ON public.plano_comercial_checklist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
