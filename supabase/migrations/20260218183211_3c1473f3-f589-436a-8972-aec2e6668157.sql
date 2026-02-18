
-- Work schedule: regular hours per weekday
CREATE TABLE public.user_horario_trabalho (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
  hora_inicio TIME NOT NULL DEFAULT '08:00',
  hora_fim TIME NOT NULL DEFAULT '18:00',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, dia_semana)
);

ALTER TABLE public.user_horario_trabalho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedule" ON public.user_horario_trabalho FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule" ON public.user_horario_trabalho FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule" ON public.user_horario_trabalho FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule" ON public.user_horario_trabalho FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can view all schedules" ON public.user_horario_trabalho FOR SELECT USING (auth.uid() IS NOT NULL);

-- Unavailability blocks
CREATE TABLE public.user_indisponibilidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  dia_inteiro BOOLEAN NOT NULL DEFAULT false,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_indisponibilidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own unavailability" ON public.user_indisponibilidades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own unavailability" ON public.user_indisponibilidades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own unavailability" ON public.user_indisponibilidades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own unavailability" ON public.user_indisponibilidades FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can view all unavailability" ON public.user_indisponibilidades FOR SELECT USING (auth.uid() IS NOT NULL);
