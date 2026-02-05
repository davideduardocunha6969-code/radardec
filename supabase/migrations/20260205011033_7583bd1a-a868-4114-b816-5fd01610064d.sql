-- Enum para status de vaga
CREATE TYPE public.vaga_status AS ENUM ('aberta', 'em_analise', 'encerrada');

-- Enum para tipo de contrato
CREATE TYPE public.tipo_contrato AS ENUM ('clt', 'pj', 'estagio');

-- Enum para modalidade
CREATE TYPE public.modalidade_trabalho AS ENUM ('presencial', 'hibrido', 'remoto');

-- Enum para senioridade
CREATE TYPE public.senioridade AS ENUM ('junior', 'pleno', 'senior');

-- Enum para status do candidato na vaga
CREATE TYPE public.candidato_status AS ENUM ('triagem_ia', 'entrevista_rh', 'entrevista_tecnica', 'proposta', 'contratado', 'reprovado', 'banco_talentos');

-- Tabela de vagas
CREATE TABLE public.vagas_recrutamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    setor TEXT NOT NULL,
    tipo_contrato tipo_contrato NOT NULL DEFAULT 'clt',
    modalidade modalidade_trabalho NOT NULL DEFAULT 'presencial',
    senioridade senioridade NOT NULL DEFAULT 'pleno',
    salario_min NUMERIC(10,2),
    salario_max NUMERIC(10,2),
    descricao TEXT,
    responsabilidades TEXT,
    hard_skills_obrigatorias TEXT[],
    hard_skills_desejaveis TEXT[],
    soft_skills TEXT[],
    experiencia_minima_anos INTEGER DEFAULT 0,
    formacao_minima TEXT,
    peso_experiencia INTEGER DEFAULT 40,
    peso_soft_skills INTEGER DEFAULT 20,
    peso_formacao INTEGER DEFAULT 15,
    peso_cursos INTEGER DEFAULT 10,
    peso_fit_cultural INTEGER DEFAULT 15,
    status vaga_status NOT NULL DEFAULT 'aberta',
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de candidatos (banco de talentos global)
CREATE TABLE public.candidatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    linkedin_url TEXT,
    resumo TEXT,
    experiencia_total_anos INTEGER DEFAULT 0,
    ultimo_cargo TEXT,
    formacao TEXT,
    skills_detectadas TEXT[],
    cursos_extras TEXT[],
    idiomas TEXT[],
    dados_extraidos JSONB DEFAULT '{}'::jsonb,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(email)
);

-- Tabela de currículos
CREATE TABLE public.curriculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID REFERENCES public.candidatos(id) ON DELETE CASCADE NOT NULL,
    arquivo_nome TEXT NOT NULL,
    arquivo_url TEXT NOT NULL,
    arquivo_tipo TEXT,
    texto_extraido TEXT,
    processado BOOLEAN DEFAULT false,
    erro_processamento TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relacionamento candidato x vaga (com score e status)
CREATE TABLE public.candidato_vaga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID REFERENCES public.candidatos(id) ON DELETE CASCADE NOT NULL,
    vaga_id UUID REFERENCES public.vagas_recrutamento(id) ON DELETE CASCADE NOT NULL,
    curriculo_id UUID REFERENCES public.curriculos(id) ON DELETE SET NULL,
    score_total INTEGER DEFAULT 0,
    score_detalhado JSONB DEFAULT '{}'::jsonb,
    explicacao_score TEXT,
    status candidato_status NOT NULL DEFAULT 'triagem_ia',
    ordem INTEGER DEFAULT 0,
    notas TEXT,
    enviar_email_automatico BOOLEAN DEFAULT true,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(candidato_id, vaga_id)
);

-- Tabela de análises IA
CREATE TABLE public.analises_curriculo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculo_id UUID REFERENCES public.curriculos(id) ON DELETE CASCADE NOT NULL,
    vaga_id UUID REFERENCES public.vagas_recrutamento(id) ON DELETE CASCADE NOT NULL,
    prompt_usado TEXT,
    resposta_ia JSONB,
    score_calculado INTEGER,
    match_skills JSONB,
    match_experiencia JSONB,
    match_formacao JSONB,
    pontos_fortes TEXT[],
    pontos_fracos TEXT[],
    recomendacao TEXT,
    processado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de movimentações
CREATE TABLE public.historico_candidato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_vaga_id UUID REFERENCES public.candidato_vaga(id) ON DELETE CASCADE NOT NULL,
    status_anterior candidato_status,
    status_novo candidato_status NOT NULL,
    observacao TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de templates de email (para uso futuro)
CREATE TABLE public.email_templates_recrutamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    assunto TEXT NOT NULL,
    corpo TEXT NOT NULL,
    tipo TEXT NOT NULL, -- aprovado, entrevista, reprovado, documentos, proposta
    ativo BOOLEAN DEFAULT true,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de emails enviados (histórico)
CREATE TABLE public.emails_recrutamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id UUID REFERENCES public.candidatos(id) ON DELETE CASCADE NOT NULL,
    vaga_id UUID REFERENCES public.vagas_recrutamento(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.email_templates_recrutamento(id) ON DELETE SET NULL,
    assunto TEXT NOT NULL,
    corpo TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    enviado_em TIMESTAMP WITH TIME ZONE,
    erro TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurações do módulo de recrutamento
CREATE TABLE public.config_recrutamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_agendamento_padrao TEXT,
    email_resposta TEXT,
    envio_automatico_habilitado BOOLEAN DEFAULT false,
    dias_alerta_vaga_parada INTEGER DEFAULT 7,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vagas_recrutamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidato_vaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analises_curriculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_candidato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates_recrutamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails_recrutamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_recrutamento ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Apenas admins podem acessar
CREATE POLICY "Admins can manage vagas" ON public.vagas_recrutamento FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage candidatos" ON public.candidatos FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage curriculos" ON public.curriculos FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage candidato_vaga" ON public.candidato_vaga FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage analises" ON public.analises_curriculo FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage historico" ON public.historico_candidato FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage email_templates" ON public.email_templates_recrutamento FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage emails" ON public.emails_recrutamento FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage config" ON public.config_recrutamento FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_vagas_recrutamento_updated_at BEFORE UPDATE ON public.vagas_recrutamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_candidatos_updated_at BEFORE UPDATE ON public.candidatos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_candidato_vaga_updated_at BEFORE UPDATE ON public.candidato_vaga FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates_recrutamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_config_recrutamento_updated_at BEFORE UPDATE ON public.config_recrutamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para currículos
INSERT INTO storage.buckets (id, name, public) VALUES ('curriculos', 'curriculos', false);

-- Storage policies
CREATE POLICY "Admins can upload curriculos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'curriculos' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view curriculos" ON storage.objects FOR SELECT USING (bucket_id = 'curriculos' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete curriculos" ON storage.objects FOR DELETE USING (bucket_id = 'curriculos' AND has_role(auth.uid(), 'admin'));