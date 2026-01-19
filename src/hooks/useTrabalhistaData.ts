import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InicialTrabalhista {
  responsavel: string;
  tipoInicial: string;
  semana: string;
  mesAno: string;
  cliente: string;
  profissao: string;
  valorCausa: number;
  expectativaHonorarios: number;
  horasExtras: string;
  vinculoEmprego: string;
  acidenteTrabalho: string;
  insalubridadePericulosidade: string;
  situacao: string;
}

export interface TrabalhistaStats {
  totalIniciais: number;
  iniciaisPorResponsavel: Record<string, number>;
  iniciaisPorTipo: Record<string, number>;
  iniciaisPorSemana: Record<string, number>;
  iniciaisPorMesAno: Record<string, number>;
  iniciaisPorProfissao: Record<string, number>;
  iniciaisPorSituacao: Record<string, number>;
  valorTotalCausasNicho: number;
  honorariosTotalNicho: number;
  temasDiscutidos: {
    horasExtras: number;
    vinculoEmprego: number;
    acidenteTrabalho: number;
    insalubridadePericulosidade: number;
    nenhumTema: number;
  };
}

export interface TrabalhistaData {
  iniciais: InicialTrabalhista[];
  stats: TrabalhistaStats;
}

async function fetchTrabalhistaData(): Promise<TrabalhistaData> {
  const { data, error } = await supabase.functions.invoke('fetch-trabalhista');
  
  if (error) {
    console.error('Error fetching trabalhista data:', error);
    throw new Error(error.message || 'Erro ao buscar dados trabalhistas');
  }
  
  return data as TrabalhistaData;
}

export function useTrabalhistaData() {
  return useQuery({
    queryKey: ['trabalhista-data'],
    queryFn: fetchTrabalhistaData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
