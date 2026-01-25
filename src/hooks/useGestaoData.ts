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
    sdrMessagesData,
    sdrMessagesSdrNames,
    indicacoesData,
    indicacoesRecebidasData,
    saneamentoData: saneamentoComercialData,
    administrativoData,
    testemunhasData,
    administrativo2Data,
    documentosFisicosData,
    bancarioAgendamentosData,
    weeks: commercialWeeks,
    isLoading: commercialLoading,
    error: commercialError,
  } = useCommercialData();

  const {
    iniciaisData,
    saneamentoData: saneamentoBancarioData,
    transitoData,
    weeks: bancarioWeeks,
    isLoading: bancarioLoading,
    error: bancarioError,
  } = useBancarioData();

  const {
    tasks,
    conformityErrors,
    deadlineErrors,
    intimacoesPrevidenciario,
    sectorMapping,
    isLoading: controladoriaLoading,
    error: controladoriaError,
  } = useSheetData();

  const previdenciarioQuery = usePrevidenciarioData();
  const previdenciarioData = previdenciarioQuery.data;
  const previdenciarioLoading = previdenciarioQuery.isLoading;
  const previdenciarioError = previdenciarioQuery.error;

  const trabalhistaQuery = useTrabalhistaData();
  const trabalhistaData = trabalhistaQuery.data;
  const trabalhistaLoading = trabalhistaQuery.isLoading;
  const trabalhistaError = trabalhistaQuery.error;

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

  // Context data for AI - ALL DATA FROM ALL SOURCES
  const contextData = {
    // ======= PLANILHAS - COMERCIAL (GID: 0, 1631515229, 686842485, 290508236, 2087539342, 1874749978, 651337262, 1905290884, 774111166, 186802545, 199327118) =======
    commercial: {
      records: commercialRecords, // GID 0 - Atendimentos/Fechamentos
      sdrData, // GID 1631515229 - SDR Agendamentos
      sdrMessagesData, // GID 686842485 - SDR Mensagens
      sdrMessagesSdrNames, // Nomes dos SDRs
      indicacoesData, // GID 290508236 - Contatos Indicações
      indicacoesRecebidasData, // GID 2087539342 - Indicações Recebidas
      saneamentoData: saneamentoComercialData, // GID 1874749978 - Saneamento
      administrativoData, // GID 651337262 - Avaliações Google
      testemunhasData, // GID 774111166 - Abordagem Testemunhas
      administrativo2Data, // GID 1905290884 - Documentação ADVBOX
      documentosFisicosData, // GID 186802545 - Documentos Físicos
      bancarioAgendamentosData, // GID 199327118 - Agendamentos Bancários
      weeks: commercialWeeks,
    },
    // ======= PLANILHAS - BANCÁRIO (GIDs: 0, 325813835, 642720152) =======
    bancario: {
      iniciaisData, // GID 0 - Petições Iniciais
      saneamentoData: saneamentoBancarioData, // GID 325813835 - Saneamento
      transitoData, // GID 642720152 - Trânsito em Julgado
      weeks: bancarioWeeks,
    },
    // ======= PLANILHAS - CONTROLADORIA (GIDs: 0, 1319762905, 1590941680, 1397357779, 154449292) =======
    controladoria: {
      tasks, // GID 0 - Tarefas Principais
      conformityErrors, // GID 1590941680 - Erros de Conformidade
      deadlineErrors, // GID 1397357779 - Erros de Prazo
      intimacoesPrevidenciario, // GID 154449292 - Intimações Previdenciário
      sectorMapping, // GID 1319762905 - Mapeamento de Setores
    },
    // ======= PLANILHAS - PREVIDENCIÁRIO (GIDs: 1358203598, 306675231, 1379612642, 0, 731526977) =======
    previdenciario: {
      peticoesIniciais: previdenciarioData?.peticoesIniciais || [], // GID 1358203598
      evolucaoIncapacidade: previdenciarioData?.evolucaoIncapacidade || [], // GID 306675231
      tarefas: previdenciarioData?.tarefas || [], // GID 1379612642
      aposentadorias: previdenciarioData?.aposentadorias || [], // GID 0
      pastasCorrecao: previdenciarioData?.pastasCorrecao || [], // GID 731526977
      stats: previdenciarioData?.stats || {},
    },
    // ======= PLANILHAS - TRABALHISTA (GIDs: 1523237863, 52177345) =======
    trabalhista: {
      iniciais: trabalhistaData?.iniciais || [], // GID 1523237863
      atividades: trabalhistaData?.atividades || [], // GID 52177345
      stats: trabalhistaData?.stats || {},
    },
    // ======= SUPABASE - MARKETING =======
    marketing: {
      atividades: atividadesMarketing,
      colunas: colunasAtividades,
      ideias: ideiasConteudo,
      conteudos: conteudosMidia,
    },
    // ======= SUPABASE - ROBÔS =======
    robos: {
      tiposProdutos,
      transcricoes,
      modelagens: modelagensConteudo,
    },
    // ======= SUPABASE - COMERCIAL (Closers) =======
    closers: {
      atendimentos: atendimentosClosers,
    },
    // ======= SUPABASE - PROFILES =======
    profiles,
  };

  // Data summary for header - Comprehensive
  const dataSummary = {
    // Comercial (Planilha)
    comercialAtendimentos: commercialRecords.length,
    comercialSDR: sdrData.length,
    comercialIndicacoes: indicacoesData.length,
    comercialIndicacoesRecebidas: indicacoesRecebidasData.length,
    comercialSaneamento: saneamentoComercialData.length,
    comercialAvaliacoes: administrativoData.length,
    comercialTestemunhas: testemunhasData.length,
    comercialDocsFisicos: documentosFisicosData.length,
    comercialAdvbox: administrativo2Data.length,
    // Bancário (Planilha)
    bancarioIniciais: iniciaisData.length,
    bancarioSaneamento: saneamentoBancarioData.length,
    bancarioTransito: transitoData.length,
    // Controladoria (Planilha)
    controladoriaTarefas: tasks.length,
    controladoriaErrosConformidade: conformityErrors.length,
    controladoriaErrosPrazo: deadlineErrors.length,
    controladoriaIntimacoes: intimacoesPrevidenciario.length,
    // Previdenciário (Planilha)
    previdenciarioPeticoes: previdenciarioData?.peticoesIniciais?.length || 0,
    previdenciarioAposentadorias: previdenciarioData?.aposentadorias?.length || 0,
    previdenciarioTarefas: previdenciarioData?.tarefas?.length || 0,
    previdenciarioPastasCorrecao: previdenciarioData?.pastasCorrecao?.length || 0,
    previdenciarioEvolucao: previdenciarioData?.evolucaoIncapacidade?.length || 0,
    // Trabalhista (Planilha)
    trabalhistaIniciais: trabalhistaData?.iniciais?.length || 0,
    trabalhistaAtividades: trabalhistaData?.atividades?.length || 0,
    // Marketing (Supabase)
    marketingAtividades: atividadesMarketing.length,
    marketingIdeias: ideiasConteudo.length,
    marketingConteudos: conteudosMidia.length,
    // Robôs (Supabase)
    robosTiposProdutos: tiposProdutos.length,
    robosTranscricoes: transcricoes.length,
    robosModelagens: modelagensConteudo.length,
    // Closers (Supabase)
    closersAtendimentos: atendimentosClosers.length,
  };

  return {
    contextData,
    dataSummary,
    isLoading,
    hasError,
    errorMessage,
  };
}
