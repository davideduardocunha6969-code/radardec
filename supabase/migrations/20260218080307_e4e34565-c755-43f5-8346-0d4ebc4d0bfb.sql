
-- Add responsavel_id to agenda_eventos (the person the event is assigned to)
ALTER TABLE public.agenda_eventos
ADD COLUMN responsavel_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
