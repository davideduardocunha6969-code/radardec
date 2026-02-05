-- Create table for hiring suggestions (sugestões de contratação)
CREATE TABLE IF NOT EXISTS public.sugestoes_contratacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  setor TEXT NOT NULL,
  cargo TEXT NOT NULL,
  descricao TEXT,
  responsabilidades TEXT,
  hard_skills TEXT[],
  soft_skills TEXT[],
  modalidade public.modalidade_trabalho NOT NULL DEFAULT 'presencial',
  senioridade public.senioridade NOT NULL DEFAULT 'pleno',
  tipo_contrato public.tipo_contrato NOT NULL DEFAULT 'clt',
  experiencia_minima_anos INTEGER DEFAULT 0,
  formacao_minima TEXT,
  
  -- Cost fields
  salario_mensal NUMERIC NOT NULL,
  anuidade_oab NUMERIC DEFAULT 0,
  valor_ppr NUMERIC DEFAULT 0,
  comissoes_mensais NUMERIC DEFAULT 0,
  is_advogado BOOLEAN DEFAULT false,
  
  -- Justification
  justificativa_contratacao TEXT NOT NULL,
  justificativa_nao_delegar TEXT NOT NULL,
  
  -- Status and approval
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
  aprovado_por UUID,
  aprovado_em TIMESTAMP WITH TIME ZONE,
  motivo_recusa TEXT,
  vaga_criada_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sugestoes_contratacao
ALTER TABLE public.sugestoes_contratacao ENABLE ROW LEVEL SECURITY;

-- Policies for sugestoes_contratacao
CREATE POLICY "Coordinators can create suggestions"
  ON public.sugestoes_contratacao FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'coordinator') OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Coordinators can view suggestions"
  ON public.sugestoes_contratacao FOR SELECT
  USING (
    user_id = auth.uid() OR 
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'coordinator')
  );

CREATE POLICY "Coordinators can update their pending suggestions"
  ON public.sugestoes_contratacao FOR UPDATE
  USING (
    (user_id = auth.uid() AND status = 'pendente') OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete suggestions"
  ON public.sugestoes_contratacao FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info', 'success', 'warning', 'error')),
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  enviado_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notificacoes
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Policies for notificacoes
CREATE POLICY "Users can view their own notifications"
  ON public.notificacoes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notificacoes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications for any user"
  ON public.notificacoes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own notifications"
  ON public.notificacoes FOR DELETE
  USING (user_id = auth.uid());

-- Create trigger to update updated_at on sugestoes_contratacao
CREATE TRIGGER update_sugestoes_contratacao_updated_at
  BEFORE UPDATE ON public.sugestoes_contratacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user is coordinator
CREATE OR REPLACE FUNCTION public.is_coordinator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('coordinator', 'admin')
  )
$$;

-- Add column to candidatos to track when last processed for all vagas
ALTER TABLE public.candidatos 
  ADD COLUMN IF NOT EXISTS processado_todas_vagas_em TIMESTAMP WITH TIME ZONE;

-- Add column to curriculos to track processing status
ALTER TABLE public.curriculos 
  ADD COLUMN IF NOT EXISTS processado_todas_vagas BOOLEAN DEFAULT false;