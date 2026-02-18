
-- Table to store SDRs and Closers assigned to each funnel
CREATE TABLE public.crm_funil_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id uuid NOT NULL REFERENCES public.crm_funis(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  papel text NOT NULL CHECK (papel IN ('sdr', 'closer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (funil_id, profile_id, papel)
);

-- Enable RLS
ALTER TABLE public.crm_funil_membros ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view members
CREATE POLICY "Authenticated users can view funil members"
  ON public.crm_funil_membros FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins and funil owners can manage members
CREATE POLICY "Users can manage funil members"
  ON public.crm_funil_membros FOR ALL
  USING (auth.uid() IS NOT NULL);
