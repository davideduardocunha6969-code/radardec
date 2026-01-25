import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCommercialData } from "./useCommercialData";
import { useBancarioData } from "./useBancarioData";
import { useSheetData } from "./useSheetData";
import { usePrevidenciarioData } from "./usePrevidenciarioData";
import { useTrabalhistaData } from "./useTrabalhistaData";

// Types for Supabase data
interface AtividadeMarketing {
  id: string;
  atividade: string;
  prioridade: string;
  prazo_fatal: string | null;
  coluna_id: string | null;
  responsavel_id: string | null;
  created_at: string;
}

interface IdeiaConteudo {
  id: string;
  titulo: string;
  setor: string;
  formato: string;
  prioridade: string;
  validado: boolean;
  semana_publicacao: number | null;
  created_at: string;
}

interface ConteudoMidia {
  id: string;
  titulo: string;
  setor: string;
  formato: string;
  status: string;
  prioridade: string;
  semana_publicacao: number | null;
  created_at: string;
}

interface TipoProduto {
  id: string;
  nome: string;
  setor: string;
  descricao: string | null;
}

interface Transcricao {
  id: string;
  titulo: string;
  status: string;
  duracao_segundos: number | null;
  created_at: string;
}

interface AtendimentoCloser {
  id: string;
  status: string;
  duracao_segundos: number | null;
  data_atendimento: string;
  dados_cliente: Record<string, unknown>;
  dados_atendimento: Record<string, unknown>;
  analises_ia: unknown[];
  created_at: string;
}

interface ModelagemConteudo {
  id: string;
  tipo: string;
  tipo_produto_id: string;
  status: string;
  created_at: string;
}

interface ColunaAtividade {
  id: string;
  nome: string;
  ordem: number;
}

interface Profile {
  id: string;
  display_name: string;
  user_id: string;
}

export function useGestaoData() {
  // ===== DADOS DAS PLANILHAS (já existentes) =====
  const {
    data: commercialRecords,
    sdrData,
    indicacoesData,
    indicacoesRecebidasData,
    saneamentoData: saneamentoComercialData,
    administrativoData,
    testemunhasData,
    administrativo2Data,
    documentosFisicosData,
    bancarioAgendamentosData,
    isLoading: commercialLoading,
    error: commercialError,
  } = useCommercialData();

  const {
    iniciaisData,
    saneamentoData: saneamentoBancarioData,
    transitoData,
    isLoading: bancarioLoading,
    error: bancarioError,
  } = useBancarioData();

  const {
    tasks,
    conformityErrors,
    deadlineErrors,
    intimacoesPrevidenciario,
    isLoading: controladoriaLoading,
    error: controladoriaError,
  } = useSheetData();

  const {
    data: previdenciarioData,
    isLoading: previdenciarioLoading,
    error: previdenciarioError,
  } = usePrevidenciarioData();

  const {
    data: trabalhistaData,
    isLoading: trabalhistaLoading,
    error: trabalhistaError,
  } = useTrabalhistaData();

  // ===== DADOS DO MARKETING (Supabase) =====
  const { data: atividadesMarketing = [], isLoading: atividadesLoading } = useQuery({
    queryKey: ["gestao-atividades-marketing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades_marketing")
        .select("id, atividade, prioridade, prazo_fatal, coluna_id, responsavel_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AtividadeMarketing[];
    },
  });

  const { data: colunasAtividades = [] } = useQuery({
    queryKey: ["gestao-colunas-atividades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades_colunas")
        .select("id, nome, ordem")
        .order("ordem");
      if (error) throw error;
      return data as ColunaAtividade[];
    },
  });

  const { data: ideiasConteudo = [], isLoading: ideiasLoading } = useQuery({
    queryKey: ["gestao-ideias-conteudo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideias_conteudo")
        .select("id, titulo, setor, formato, prioridade, validado, semana_publicacao, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as IdeiaConteudo[];
    },
  });

  const { data: conteudosMidia = [], isLoading: conteudosLoading } = useQuery({
    queryKey: ["gestao-conteudos-midia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conteudos_midia")
        .select("id, titulo, setor, formato, status, prioridade, semana_publicacao, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ConteudoMidia[];
    },
  });

  // ===== DADOS DOS ROBÔS (Supabase) =====
  const { data: tiposProdutos = [], isLoading: produtosLoading } = useQuery({
    queryKey: ["gestao-tipos-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_produtos")
        .select("id, nome, setor, descricao")
        .order("nome");
      if (error) throw error;
      return data as TipoProduto[];
    },
  });

  const { data: transcricoes = [], isLoading: transcricoesLoading } = useQuery({
    queryKey: ["gestao-transcricoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transcricoes")
        .select("id, titulo, status, duracao_segundos, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transcricao[];
    },
  });

  const { data: modelagensConteudo = [], isLoading: modelagensLoading } = useQuery({
    queryKey: ["gestao-modelagens-conteudo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modelagens_conteudo")
        .select("id, tipo, tipo_produto_id, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ModelagemConteudo[];
    },
  });

  // ===== DADOS DO COMERCIAL (Supabase - Closers) =====
  const { data: atendimentosClosers = [], isLoading: atendimentosLoading } = useQuery({
    queryKey: ["gestao-atendimentos-closers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos_closers")
        .select("id, status, duracao_segundos, data_atendimento, dados_cliente, dados_atendimento, analises_ia, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AtendimentoCloser[];
    },
  });

  // ===== DADOS DE PERFIS (para mapear responsáveis) =====
  const { data: profiles = [] } = useQuery({
    queryKey: ["gestao-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, user_id")
        .order("display_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Loading state
  const isLoading =
    commercialLoading ||
    bancarioLoading ||
    controladoriaLoading ||
    previdenciarioLoading ||
    trabalhistaLoading ||
    atividadesLoading ||
    ideiasLoading ||
    conteudosLoading ||
    produtosLoading ||
    transcricoesLoading ||
    modelagensLoading ||
    atendimentosLoading;

  // Errors
  const hasError =
    commercialError || bancarioError || controladoriaError || previdenciarioError || trabalhistaError;

  const errorMessage =
    commercialError ||
    bancarioError ||
    controladoriaError ||
    (previdenciarioError instanceof Error ? previdenciarioError.message : "") ||
    (trabalhistaError instanceof Error ? trabalhistaError.message : "");

  // Context data for AI
  const contextData = {
    // Planilhas - Comercial
    commercial: {
      records: commercialRecords,
      sdrData,
      indicacoesData,
      indicacoesRecebidasData,
      saneamentoData: saneamentoComercialData,
      administrativoData,
      testemunhasData,
      administrativo2Data,
      documentosFisicosData,
      bancarioAgendamentosData,
    },
    // Planilhas - Bancário
    bancario: {
      iniciaisData,
      saneamentoData: saneamentoBancarioData,
      transitoData,
    },
    // Planilhas - Controladoria
    controladoria: {
      tasks,
      conformityErrors,
      deadlineErrors,
      intimacoesPrevidenciario,
    },
    // Planilhas - Previdenciário
    previdenciario: previdenciarioData || {},
    // Planilhas - Trabalhista
    trabalhista: trabalhistaData || {},
    // Supabase - Marketing
    marketing: {
      atividades: atividadesMarketing,
      colunas: colunasAtividades,
      ideias: ideiasConteudo,
      conteudos: conteudosMidia,
    },
    // Supabase - Robôs
    robos: {
      tiposProdutos,
      transcricoes,
      modelagens: modelagensConteudo,
    },
    // Supabase - Comercial (Closers)
    closers: {
      atendimentos: atendimentosClosers,
    },
    // Supabase - Profiles (para referência)
    profiles,
  };

  // Data summary for header
  const dataSummary = {
    comercial: commercialRecords.length,
    bancarioIniciais: iniciaisData.length,
    controladoriaTarefas: tasks.length,
    previdenciario: previdenciarioData?.peticoesIniciais?.length || 0,
    trabalhista: trabalhistaData?.iniciais?.length || 0,
    atividadesMarketing: atividadesMarketing.length,
    ideiasConteudo: ideiasConteudo.length,
    conteudosMidia: conteudosMidia.length,
    tiposProdutos: tiposProdutos.length,
    transcricoes: transcricoes.length,
    atendimentosClosers: atendimentosClosers.length,
  };

  return {
    contextData,
    dataSummary,
    isLoading,
    hasError,
    errorMessage,
  };
}
