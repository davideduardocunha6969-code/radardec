
CREATE TABLE public.crm_lead_campos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  key text NOT NULL UNIQUE,
  tipo text NOT NULL DEFAULT 'texto',
  ordem integer NOT NULL DEFAULT 0,
  obrigatorio boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_lead_campos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campos"
  ON public.crm_lead_campos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage campos"
  ON public.crm_lead_campos FOR ALL
  USING (auth.uid() IS NOT NULL);

INSERT INTO public.crm_lead_campos (nome, key, tipo, ordem) VALUES
  ('CPF', 'cpf', 'texto', 1),
  ('Empresa', 'empresa', 'texto', 2),
  ('Cargo', 'cargo', 'texto', 3),
  ('Data Admissão', 'data_admissao', 'data', 4),
  ('Data Demissão', 'data_demissao', 'data', 5),
  ('Motivo Demissão', 'motivo_demissao', 'texto', 6),
  ('Município', 'municipio', 'texto', 7),
  ('UF', 'uf', 'texto', 8),
  ('Endereço', 'endereco', 'texto', 9);
