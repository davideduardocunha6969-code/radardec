
-- Tipos de evento da agenda (gerenciados por admin)
CREATE TABLE public.agenda_tipos_evento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#6366f1',
  icone text NOT NULL DEFAULT 'calendar',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_tipos_evento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view tipos_evento"
ON public.agenda_tipos_evento FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage tipos_evento"
ON public.agenda_tipos_evento FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial types
INSERT INTO public.agenda_tipos_evento (nome, cor, icone, ordem) VALUES
  ('Atendimento Closer', '#10b981', 'phone-call', 0),
  ('Tarefa Interna', '#6366f1', 'clipboard-list', 1),
  ('Bloqueio de Horário', '#ef4444', 'lock', 2),
  ('Audiência / Prazo', '#f59e0b', 'gavel', 3);
