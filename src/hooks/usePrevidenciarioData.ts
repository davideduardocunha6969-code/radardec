import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PeticaoInicial {
  responsavel: string;
  semana: string;
  mes: string;
  cliente: string;
  tipoBeneficio: string;
  anoDER: string;
  valorCausa: number;
  expectativaHonorarios: number;
  epiEficaz: string;
  gps: string;
  autonomo: string;
  ruralMenor12: string;
  situacao: string;
  notaCorrecao: string;
}

export interface EvolucaoIncapacidade {
  semana: string;
  quantidadePendentes: number;
}

export interface TarefaPrevidenciario {
  semana: string;
  responsavel: string;
  tipoTarefa: string;
  cliente: string;
  dataRealizacao: string;
  numeroProcesso: string;
  revisor: string;
  notaRevisao: string;
}

export interface Aposentadoria {
  dataAnalise: string;
  responsavel: string;
  semana: string;
  cliente: string;
  dataCadastro: string;
  der: string;
  rmi: number;
  mesesTramitacao: number;
  valorCausa: number;
  tipoAcao: string;
  situacao: string;
}

export interface PastaCorrecao {
  cliente: string;
  parteContraria: string;
  tipoAcao: string;
  dataRequerimento: string;
  expectativaValorCausa: number;
  responsavel: string;
  situacao: string;
}

export interface PrevidenciarioStats {
  totalPeticoes: number;
  peticoesPorSituacao: Record<string, number>;
  peticoesPorBeneficio: Record<string, number>;
  peticoesPorResponsavel: Record<string, number>;
  totalTarefas: number;
  tarefasPorResponsavel: Record<string, number>;
  tarefasPorTipo: Record<string, number>;
  totalAposentadorias: number;
  aposentadoriasPorSituacao: Record<string, number>;
  aposentadoriasPorTipo: Record<string, number>;
  totalPastasCorrecao: number;
  pastasPorSituacao: Record<string, number>;
  valorTotalCausas: number;
  valorTotalHonorarios: number;
}

export interface PrevidenciarioData {
  peticoesIniciais: PeticaoInicial[];
  evolucaoIncapacidade: EvolucaoIncapacidade[];
  tarefas: TarefaPrevidenciario[];
  aposentadorias: Aposentadoria[];
  pastasCorrecao: PastaCorrecao[];
  stats: PrevidenciarioStats;
}

async function fetchPrevidenciarioData(): Promise<PrevidenciarioData> {
  const { data, error } = await supabase.functions.invoke('fetch-previdenciario');
  
  if (error) {
    console.error('Error fetching previdenciário data:', error);
    throw new Error(error.message || 'Erro ao buscar dados previdenciários');
  }
  
  return data as PrevidenciarioData;
}

export function usePrevidenciarioData() {
  return useQuery({
    queryKey: ['previdenciario-data'],
    queryFn: fetchPrevidenciarioData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
