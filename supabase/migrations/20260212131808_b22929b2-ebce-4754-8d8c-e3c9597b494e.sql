
-- Update DELETE policy on conteudos_midia to allow marketing_manager
DROP POLICY "Admins can delete conteudos" ON public.conteudos_midia;
CREATE POLICY "Admins and marketing managers can delete conteudos"
ON public.conteudos_midia
FOR DELETE
USING (can_validate_content(auth.uid()));

-- Update DELETE policy on ideias_conteudo to allow marketing_manager
DROP POLICY "Admins can delete ideias" ON public.ideias_conteudo;
CREATE POLICY "Admins and marketing managers can delete ideias"
ON public.ideias_conteudo
FOR DELETE
USING (can_validate_content(auth.uid()));
