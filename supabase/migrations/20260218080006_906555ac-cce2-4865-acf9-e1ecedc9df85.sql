
-- Create agenda_eventos table
CREATE TABLE public.agenda_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_evento_id UUID REFERENCES public.agenda_tipos_evento(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  dia_inteiro BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all events (shared agenda)
CREATE POLICY "Authenticated users can view all events"
ON public.agenda_eventos
FOR SELECT
TO authenticated
USING (true);

-- Users can create their own events
CREATE POLICY "Users can create their own events"
ON public.agenda_eventos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own events, admins can update any
CREATE POLICY "Users can update own events or admin"
ON public.agenda_eventos
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can delete their own events, admins can delete any
CREATE POLICY "Users can delete own events or admin"
ON public.agenda_eventos
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_agenda_eventos_updated_at
BEFORE UPDATE ON public.agenda_eventos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for date queries
CREATE INDEX idx_agenda_eventos_data ON public.agenda_eventos(data_inicio, data_fim);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agenda_eventos;
