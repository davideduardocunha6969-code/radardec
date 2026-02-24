
-- Table: coaching_prompts
CREATE TABLE public.coaching_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_key text NOT NULL,
  phase text NOT NULL,
  prompt_text text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique partial index: only one active prompt per ai_key+phase
CREATE UNIQUE INDEX idx_coaching_prompts_active ON public.coaching_prompts (ai_key, phase) WHERE is_active = true;

ALTER TABLE public.coaching_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coaching_prompts"
  ON public.coaching_prompts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view coaching_prompts"
  ON public.coaching_prompts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_coaching_prompts_updated_at
  BEFORE UPDATE ON public.coaching_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: coaching_sessions
CREATE TABLE public.coaching_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key text UNIQUE NOT NULL,
  lead_id uuid,
  chamada_id uuid REFERENCES public.crm_chamadas(id),
  user_id uuid NOT NULL,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own coaching_sessions"
  ON public.coaching_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coaching_sessions"
  ON public.coaching_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_coaching_sessions_updated_at
  BEFORE UPDATE ON public.coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
