
-- Table for coaching AI configurations
CREATE TABLE public.robos_coach (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  instrucoes TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.robos_coach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view robos_coach"
  ON public.robos_coach FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage robos_coach"
  ON public.robos_coach FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Link coach to funnel columns
ALTER TABLE public.crm_colunas ADD COLUMN robo_coach_id UUID REFERENCES public.robos_coach(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_robos_coach_updated_at
  BEFORE UPDATE ON public.robos_coach
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
