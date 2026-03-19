
-- Nodes table
CREATE TABLE public.plano_comercial_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  node_type text NOT NULL DEFAULT 'posicao',
  label text NOT NULL,
  setor text,
  funil text,
  pessoa_nome text,
  precisa_contratar boolean NOT NULL DEFAULT true,
  position_x double precision NOT NULL DEFAULT 0,
  position_y double precision NOT NULL DEFAULT 0,
  dados_extras jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plano_comercial_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plano nodes"
  ON public.plano_comercial_nodes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Edges table
CREATE TABLE public.plano_comercial_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_node_id uuid NOT NULL REFERENCES public.plano_comercial_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES public.plano_comercial_nodes(id) ON DELETE CASCADE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plano_comercial_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plano edges"
  ON public.plano_comercial_edges FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger for nodes
CREATE TRIGGER update_plano_comercial_nodes_updated_at
  BEFORE UPDATE ON public.plano_comercial_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
