-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can update conteudos" ON public.conteudos_midia;

-- Create more restrictive update policy - authenticated users can update any content
CREATE POLICY "Authenticated users can update conteudos"
ON public.conteudos_midia
FOR UPDATE
USING (auth.uid() IS NOT NULL);