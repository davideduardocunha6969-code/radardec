-- Add publication week column to conteudos_midia
ALTER TABLE public.conteudos_midia 
ADD COLUMN semana_publicacao integer CHECK (semana_publicacao >= 1 AND semana_publicacao <= 52);