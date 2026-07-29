
ALTER TABLE public.ideias_conteudo
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE public.conteudos_midia
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

DROP POLICY IF EXISTS "Admins and marketing managers can delete ideias" ON public.ideias_conteudo;
CREATE POLICY "Authenticated users can delete ideias"
  ON public.ideias_conteudo FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins and marketing managers can delete conteudos" ON public.conteudos_midia;
CREATE POLICY "Authenticated users can delete conteudos"
  ON public.conteudos_midia FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
