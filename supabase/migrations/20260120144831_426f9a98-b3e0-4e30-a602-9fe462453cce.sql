-- Add prioridade column to ideias_conteudo table
ALTER TABLE public.ideias_conteudo 
ADD COLUMN prioridade text NOT NULL DEFAULT 'util';

-- Add prioridade column to conteudos_midia table
ALTER TABLE public.conteudos_midia 
ADD COLUMN prioridade text NOT NULL DEFAULT 'util';